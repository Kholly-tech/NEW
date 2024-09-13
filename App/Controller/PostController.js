const User = require("../Models/UserModel");
const { Post, CommunityPost } = require("../Models/PostModel");
const { saveNotification } = require("../Helper/notificationHelper");
const Reel = require("../Models/ReelModel");
const { downloadFile, deleteFile } = require("../Helper/storageService");

// Create a new post
const createPost = async(req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const post = new Post({
            ...req.body,
            user: req.user._id,
        });
        await post.save();

        // Populate info after saving
        await post.populate("medias");
        await post.populate({
            path: "user",
            select: "first_name last_name _id picture username",
            populate: {
                path: "picture",
                // select: "url"
            }
        });



        // save notification for each tagged user
        const taggedUserIds = post.tags;
        console.log("Tagged Users", taggedUserIds);
        taggedUserIds.forEach(async(userId) => {
            console.log("Each tagged Users", userId);
            await saveNotification(
                userId,
                `${req.user.username} tagged you and ${
          taggedUserIds.length - 1
        } others in a post`,
                "You were tagged in a post"
            );
        });

        user.posts.push(post._id);
        await user.save();

        // Prepare the response object
        const responsePost = post.toObject(); // Convert to a plain JavaScript object

        // Add user information
        responsePost.user = {
            id: post.user._id,
            first_name: post.user.first_name,
            last_name: post.user.last_name,
            picture: post.user.picture,
            username: post.user.username,
        };

        // Remove any fields you don't want in the response
        delete responsePost.__v;
        delete responsePost.$isNew;
        console.log("responsePost", responsePost);

        res.status(201).json(responsePost);
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: error.message });
    }
};

// Get a post by ID
const getPostById = async(req, res) => {
    let post;
    try {
        const currentTime = new Date();
        const postId = req.params.id;

        // Query for regular posts
        post = await Post.findOne({
                _id: postId,
                $or: [
                    { schedulePost: { $lte: currentTime } },
                    { schedulePost: null },
                ],
            })
            .populate({
                path: "user",
                select: "first_name last_name _id picture username",
                populate: {
                    path: "picture",
                    // select: "url"
                }
            })
            .populate("tags", "username picture first_name last_name")
            .populate("medias");

        if (!post) {
            // Query for community posts
            post = await CommunityPost.findOne({
                    _id: postId,
                    $or: [
                        { schedulePost: { $lte: currentTime } },
                        { schedulePost: null },
                    ],
                })
                .populate("user")
                .populate("tags", "username picture first_name last_name");

            if (!post) {
                return res.status(404).send({ message: "Post not found" });
            }
        }

        res.status(200).send({ post: post });
    } catch (error) {
        console.log(error);
        res.status(500).send(error);
    }
};

// Update a post by ID
const updatePostById = async(req, res) => {
    let post;
    try {
        const userId = req.user._id.toString();
        a = Post;
        post = await Post.findById(req.params.id);
        if (!post) {
            a = CommunityPost;
            post = await CommunityPost.findById(req.params.id);
            if (!post) {
                return res.status(404).send({ message: "Post not found" });
            }
        }
        if (post.user.toString() !== userId) {
            return res.status(403).json({ error: "Unauthorized" });
        }
        post = await a.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        }).populate("user");
        post.edited = true;
        await post.save();
        res.send(post);
    } catch (error) {
        console.log(error);
        res.status(400).send(error);
    }
};

// Delete a post by ID
const deletePostById = async(req, res) => {
    let post, a;
    try {
        const user = await User.findById(req.user._id);
        const userId = req.user._id.toString();
        a = Post;
        post = await Post.findById(req.params.id)
            .populate("medias", "_id key");
        if (!post) {
            a = CommunityPost;
            post = await CommunityPost.findById(req.params.id)
                .populate("medias", "_id key");
            if (!post) {
                return res.status(404).send({ message: "Post not found" });
            }
        }
        if (post.user.toString() !== userId) {
            return res.status(403).json({ error: "Unauthorized" });
        }

        // Delete the media files from S3
        const medias = post.medias;
        for (const media of medias) {
            const deletePostMedia = await deleteFile(media.key);
        }

        // Delete the post from the database
        await a.deleteOne({ _id: req.params.id });

        if (a === Post) {
            // Remove the post from the user's posts array
            user.posts = user.posts.filter(
                (postId) => postId.toString() !== req.params.id.toString()
            );
        }

        res.send({ message: "Post deleted successfully" });
    } catch (error) {
        res.status(500).send(error);
    }
};

// Get posts by username
const getUserPosts = async(req, res) => {
    const { page = 1, limit = 10 } = req.query;

    try {
        const user = await User.findOne({ username: req.params.username }).select("_id");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const currentTime = new Date();
        const currentUserId = req.user._id; // Assuming you have the current user's ID in the request
        const isCurrentUser = user._id.toString() === currentUserId.toString();

        // Base query
        let query = {
            user: user._id,
            $or: [
                { schedulePost: { $lte: currentTime } },
                { schedulePost: null },
            ],
        };

        // Visibility filter
        if (!isCurrentUser) {
            query.visibility = { $ne: 'Hidden' };

            const currentUser = await User.findById(currentUserId);
            const isFriend = currentUser.following.includes(user._id) && currentUser.followers.includes(user._id);

            if (!isFriend) {
                query.visibility = 'Public';
            }
        }

        let posts = await Post.find(query)
            .populate({
                path: "user",
                select: "first_name last_name _id picture username",
                populate: {
                    path: "picture",
                    // select: "url"
                }
            })
            .populate("tags", "username picture first_name last_name")
            .populate("medias")
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        const count = await Post.countDocuments(query);

        res.json({
            posts,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
        });
    } catch (error) {
        console.log(error);
        res.status(500).send(error);
    }
};

// Get posts from users the current user is following
const getFollowingPosts = async(req, res) => {
    const { page = 1, limit = 10 } = req.query;

    try {
        const currentTime = new Date();
        const currentUser = await User.findById(req.user._id).populate("following").populate("followers");
        const followingIds = currentUser.following.map((follow) => follow._id);
        followingIds.push(currentUser._id);

        const query = {
            user: { $in: followingIds },
            $or: [
                { schedulePost: { $lte: currentTime } },
                { schedulePost: null },
            ],
            $or: [
                { visibility: 'Public' },
                {
                    $and: [
                        { visibility: 'Friends' },
                        { user: { $in: currentUser.followers } },
                    ]
                },
                { user: currentUser._id },
            ],
        };

        const posts = await Post.find(query)
            .populate({
                path: "user",
                select: "username _id first_name last_name followers following picture details.bio",
                populate: {
                    path: "picture",
                }
            })
            .populate("tags", "username picture first_name last_name")
            .populate("medias")
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        const count = await Post.countDocuments(query);

        // const postsWithUrls = await Promise.all(posts.map(async(post) => {
        //     // Generate URLs for post media
        //     const mediasWithUrls = await Promise.all(post.medias.map(async(media) => ({
        //         ...media,
        //         url: await downloadFile(media.key)
        //     })));

        //     // Generate URL for user profile picture
        //     const userWithPictureUrl = {
        //         ...(post.user.toObject ? post.user.toObject() : post.user),
        //         picture: await downloadFile(post.user.picture)
        //     };

        //     // Generate URLs for tagged users' profile pictures
        //     const tagsWithPictureUrls = await Promise.all(post.tags.map(async(tag) => ({
        //         ...tag.toObject(),
        //         picture: await downloadFile(tag.picture)
        //     })));

        //     return {
        //         ...post.toObject(),
        //         medias: mediasWithUrls,
        //         user: userWithPictureUrl,
        //         tags: tagsWithPictureUrls
        //     };
        // }));

        // console.log(posts);
        res.json({
            posts,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
        });
    } catch (error) {
        console.log(error);
        res.status(500).send(error);
    }
};

// const deleteMany = async (req, res) => {
//   try {
//     const ID = "665f03ebcb07ae061b2f48e7";
//     const posts = await Post.deleteMany({ user: ID });
//     res.send(posts);
//   } catch (error) {
//     res.status(500).send(error);
//   }
// };

const getAllPosts = async(req, res) => {
    try {
        const currentTime = new Date(); // Get the current date and time

        const posts = await Post.find({
                $or: [
                    { schedulePost: { $lte: currentTime } }, // Include posts where schedulePost is less than or equal to the current time
                    { schedulePost: null }, // Include posts without a schedulePost value,
                ],
            })
            .populate("user")
            .populate("tags", "username picture first_name last_name")
            .populate("medias")
            .sort({ schedulePost: 1, createdAt: -1 }); // Sort by schedulePost (ascending) and createdAt (descending)

        const count = await Post.countDocuments({});
        const postCount = posts.length;

        res.status(200).send({ count, postCount, posts });
    } catch (error) {
        res.status(500).send(error);
    }
};

// Like a post
const likePost = async(req, res) => {
    console.log("Like post clicked 1");
    let post;
    const postId = req.params.id;
    try {
        post = await Post.findById(postId);
        if (!post) {
            console.log("Like post clicked 2");
            post = await CommunityPost.findById(postId);
            if (!post) {
                console.log("Like post clicked 3");
                post = await Reel.findById(postId);
                if (!post) {
                    return res.status(404).send({ message: "Post not found" });
                }
            }
        }

        // Add the current user's ID to the likes array if not already liked
        if (!post.likes.includes(req.user._id)) {
            post.likes.push(req.user._id);
            console.log("Like post clicked 4");
            await post.save();
            console.log("Post saved");
        }

        res.send(post);
    } catch (error) {
        console.log(error);
        res.status(500).send(error);
    }
};

// Unlike a post
const unlikePost = async(req, res) => {
    console.log("Unlike post clicked 1");
    let post;
    const postId = req.params.id;
    try {
        post = await Post.findById(postId);
        if (!post) {
            console.log("Unlike post clicked 2");
            post = await CommunityPost.findById(postId);
            if (!post) {
                console.log("Unlike post clicked 3");
                post = await Reel.findById(postId);
                if (!post) {
                    return res.status(404).send({ message: "Post not found" });
                }
            }
        }

        // Remove the current user's ID from the likes array if already liked
        post.likes = post.likes.filter(
            (userId) => userId.toString() !== req.user._id.toString()
        );
        console.log("Unlike post clicked 4");
        await post.save();

        res.send(post);
    } catch (error) {
        console.log(error);
        res.status(500).send(error);
    }
};

// Save a Post
const savePost = async(req, res) => {
    try {
        let post, kind;
        const postId = req.params.id;

        // Find Post by ID 
        kind = "Post";
        post = await Post.findById(postId);
        if (!post) {
            kind = "CommunityPost";
            post = await CommunityPost.findById(postId);
            if (!post) {
                return res.status(404).send({ message: "Post not found" });
            }
        }

        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).send({ message: "User not found" });

        // Check if the post ID is already present in the savedPosts
        const isPostSaved = user.savedPosts.some(
            (savedPost) => savedPost._id.toString() === post._id.toString()
        );

        if (isPostSaved) {
            return res.status(400).send({ message: "Post already saved" });
        }

        // Save Post if it is not already saved
        user.savedPosts.push({ post: post._id, kind: kind });
        await user.save();
        return res.status(200).send({ message: "Post saved successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).send(error);
    }
};

// Unsave a Post
const unsavePost = async(req, res) => {
    let post;
    const postId = req.params.id;
    try {
        // Find Post by ID
        const post = await Post.findById(postId);
        if (!post) {
            post = await CommunityPost.findById(postId);
            if (!post) {
                return res.status(404).send({ message: "Post not found" });
            }
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).send({ message: "User not found" });
        }
        const savedPosts = user.savedPosts;
        let idToRemove = post._id.toString();

        // Unsave Post if it is already saved
        const updatedSavedPosts = savedPosts.filter(savedPost => savedPost._id.toString() !== idToRemove);
        user.savedPosts = updatedSavedPosts;
        await user.save();
        return res.status(200).send({ message: "Post unsaved successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).send(error);
    }
};

// Get Saved Posts
const getSavedPosts = async(req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .populate({
                path: 'savedPosts',
                populate: { path: 'posts', model: 'Post' },
                options: { strictPopulate: false }
            });

        if (!user) {
            return res.status(404).send({ message: 'User not found' });
        }
        console.log(user.savedPosts, user.first_name);

        const sortedSavedPosts = user.savedPosts.sort((a, b) => b.savedAt - a.savedAt);

        console.log(sortedSavedPosts);
        // Extract the post IDs from the savedPosts array
        const postIds = sortedSavedPosts.map(post => post.post);

        console.log(postIds);

        // Find the full post details using the post IDs
        let posts = await Post.find({ _id: { $in: postIds } })
            .populate("medias");

        // console.log(posts);

        res.status(200).json(posts);
    } catch (error) {
        console.log(error);
        res.status(500).send(error);
    }
};



// Get a Saved Post by ID
const getSavedPostById = async(req, res) => {
    try {
        const user = await User.findById(req.user._id).populate("savedPosts");
        let post = await Post.findById(req.params.id)
            .populate({
                path: "user",
                select: "username _id first_name last_name followers following picture details.bio", // Select specific fields
                populate: {
                    path: "picture",
                },
            })
            .populate("tags", "username picture first_name last_name")
            .populate("medias");
        if (!post) return res.status(404).send({ message: "Post not found" });
        // if (!user.savedPosts.includes(post._id)) return res.status(404).send({ message: "Post not yet found" });

        res.status(200).send(post);
    } catch (error) {
        console.log(error);
        res.status(500).send(error);
    }
};

// Get All Scheduled Posts
const getAllScheduledPosts = async(req, res) => {
    try {
        const posts = await Post.find({
                user: req.user._id,
                schedulePost: { $ne: null }, // Include posts where schedulePost is not null
            })
            .populate({
                path: "user",
                select: "username _id first_name last_name followers following picture details.bio", // Select specific fields
                populate: {
                    path: "picture",
                },
            })
            .populate("tags", "username picture first_name last_name")
            .populate("medias")
            .sort({ schedulePost: 1, createdAt: -1 }); // Sort by schedulePost (ascending) and createdAt (descending)
        if (posts.length === 0) return res.status(404).send({ message: "No Scheduled posts found" });

        res.status(200).send(posts);
    } catch (error) {
        console.log(error);
        res.status(500).send(error);
    }
};

// Delete a scheduled post by ID
const deleteScheduledPost = async(req, res) => {
    try {
        const post = await Post.findById(req.params.id)
            .populate("medias", "_id key");
        if (!post) return res.status(404).send({ message: "Post not found" });
        if (post.user.toString() !== req.user._id.toString()) return res.status(401).send({ message: "Unauthorized" });

        // Deleete the media files from S3
        const medias = post.medias;
        for (const media of medias) {
            const deleteMedia = await deleteFile(media.key);
        }

        // Delete the post from the database
        await post.deleteOne(req.params.id, (error) => {
            if (error) return res.status(500).send(error);
            res.status(200).send({ message: "Post deleted successfully" });
        });
    } catch (error) {
        console.log(error);
        res.status(500).send(error);
    }
};

// Hide a User Post
const hidePost = async(req, res) => {
    const postId = req.params.id;
    const userId = req.user._id;
    try {
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).send({ message: "Post not found" });
        }

        if (post.user.toString() !== userId.toString()) {
            return res.status(401).send({ message: "Unauthorized" });
        }

        post.visibility = "Hidden";
        await post.save();
        return res.status(200).send({ message: "Post hidden successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).send(error);
    }
};

// Save a user's answer or option for a poll post
const savePollAnswer = async(req, res) => {
    try {
        const { postId, optionIndex } = req.body;
        const userId = req.user._id;

        // Find the post by ID
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        // Check if the post has a poll
        if (!post.poll || post.poll.length === 0) {
            return res.status(400).json({ message: "This post does not have a poll" });
        }
        postPoll = post.poll;

        // Check if the optionIndex is valid
        const pollOptions = postPoll.options;
        if (optionIndex < 0 || optionIndex >= pollOptions.length) {
            return res.status(400).json({ message: "Invalid option index" });
        }

        // Save the user's answer or option
        const userAnswer = {
            user: userId,
            option: optionIndex,
        };

        // Check if the user has already answered the poll
        const existingAnswer = postPoll.answers.find(
            (answer) => answer.user.toString() === userId.toString()
        );

        if (existingAnswer) {
            // Update the existing answer
            existingAnswer.option = optionIndex;
        } else {
            // Add a new answer
            postPoll.answers.push(userAnswer);
        }

        // Save the updated post
        await post.save();

        res.status(200).json({ message: "Poll answer saved successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

const getAllThePosts = async(req, res) => {
    const { page = 1, limit = 10 } = req.query; // Get pagination parameters from query
    const userId = req.user._id; // Keep this as an ObjectId
    const currentTime = new Date();
    try {
        const user = await User.findById(userId);
        const userPosts = await Post.find({ user: userId })
            .populate({
                path: "user",
                select: "username _id first_name last_name followers following picture",
            })
            .populate("tags", "username picture first_name last_name")
            .populate("medias")
            .sort({ createdAt: -1 });

        const taggedPosts = await Post.find({ tags: userId }) // Now userId is an ObjectId
            .populate({
                path: "user",
                select: "username _id first_name last_name followers following picture",
            })
            .populate("tags", "username picture first_name last_name")
            .populate("medias")
            .sort({ createdAt: -1 });

        const taggedCommunityPosts = await CommunityPost.find({ tags: userId })
            .populate({
                path: "user",
                select: "username _id first_name last_name followers following picture",
            })
            .populate("tags", "username picture first_name last_name")
            .populate("medias")
            .sort({ createdAt: -1 });

        const userCommunityPosts = await CommunityPost.find({ user: userId })
            .populate({
                path: "user",
                select: "username _id first_name last_name followers following picture",
            })
            .populate("tags", "username picture first_name last_name")
            .populate("medias")
            .sort({ createdAt: -1 });

        const followingIds = user.following.map((follow) => follow._id);
        const followingPosts = await Post.find({
                user: { $in: followingIds },
                $or: [
                    { schedulePost: { $lte: currentTime } },
                    { schedulePost: null }
                ],
            })
            .populate({
                path: "user",
                select: "username _id first_name last_name followers following picture",
            })
            .populate("tags", "username picture first_name last_name")
            .populate("medias")
            .sort({ createdAt: -1 });

        // Merge all the posts together...
        const allPosts = [...userPosts, ...taggedPosts, ...followingPosts, ...userCommunityPosts, ...taggedCommunityPosts];

        // Remove duplicates
        const dPosts = Array.from(new Set(allPosts.map(post => post._id.toString())))
            .map(_id => allPosts.find(post => post._id.toString() === _id));

        let posts = await Promise.all(
            dPosts
            .slice((page - 1) * limit, page * limit)
            .map((post) => post.toObject())
        );

        console.log(posts.length);
        res.status(200).send({
            posts,
            totalPages: Math.ceil(posts.length / limit),
            currentPage: page,
        });
    } catch (error) {
        console.log("Error in getAllThePosts:", error);
        res.status(500).send(error);
    }
};


module.exports = {
    createPost,
    getPostById,
    updatePostById,
    deletePostById,
    getUserPosts,
    getFollowingPosts,
    likePost,
    unlikePost,
    savePost,
    getSavedPosts,
    getSavedPostById,
    getAllPosts,
    getAllThePosts,
    unsavePost,
    deleteScheduledPost,
    savePollAnswer,
    getAllScheduledPosts,
    hidePost,
    // deleteMany
}; // deleteMany