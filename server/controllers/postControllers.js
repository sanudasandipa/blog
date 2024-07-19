const Post = require('../models/postModel')
const User = require("../models/userModel")
const path = require('path')
const fs = require('fs')
const { v4: uuid } = require('uuid')
const HttpError = require('../models/errorModel')





// ================================ Create a post
// POST : api/posts
// PROTECTED

const createPost = async (req, res, next) => {
    try {
        let { title, category, description } = req.body;
        if (!title || !category || !description || !req.files) {
            return next(new HttpError("Fill in all fields and choose thumbnail", 422))
        }
        const { thumbnail } = req.files;
        // check the file size
        if (thumbnail.size > 2000000) {
            return next(new HttpError("Thumbnail too big. File should be less than 2mb."))
        }

        let fileName = thumbnail.name;
        let splittedFilename = fileName.split('.')
        let newFilename = splittedFilename[0] + uuid() + "." + splittedFilename[splittedFilename.length - 1]
        thumbnail.mv(path.join(__dirname, '..', '/uploads', newFilename), async (err) => {
            if (err) {
                return next(new HttpError(err))
            } else {
                const newPost = await Post.create({ title, category, description, thumbnail: newFilename, creator: req.user.id })
                if (!newPost) {
                    return next(new HttpError("Post couldn't be created.", 422))
                }
                // find user and increate post count by 1
                const currentUser = await User.findById(req.user.id);
                const userPostCount = currentUser.posts + 1;
                await User.findByIdAndUpdate(req.user.id, { posts: userPostCount })

                res.status(201).json(newPost)
            }
        })

    } catch (error) {
        return next(new HttpError(error))
    }

}




// ================================ Get all  posts
// GET : api/posts
// PROTECTED

const getPosts = async (req, res, next) => {

    try {
        const posts = await Post.find().sort({ updatedAt: -1 })
        res.status(200).json(posts)

    } catch (error) {

        return next(new HttpError(error))
    }
}




// ================================ Get single post
// GET : api/posts/:id
// UNPROTECTED

const getPost = async (req, res, next) => {

    try {
        const postId = req.params.id;
        const post = await Post.findById(postId);
        if (!post) {
            return next(new HttpError("Post not found", 404))
        }
        res.status(200).json(post)
    } catch (error) {
        return next(new HttpError(error))
    }

}






// ================================ Get post bt catrgory
// GET : api/posts/categories/:category
// UNPROTECTED

const getCatPosts = async (req, res, next) => {

    try {
        const { category } = req.params;
        const catPosts = await Post.find({ category }).sort({ createdAt: -1 })
        res.status(200).json(catPosts)

    } catch (error) {

        return next(new HttpError(error))
    }

}










// ================================ Get user/Author post
// GET : api/posts/users/:id
// UNPROTECTED

const getUserPosts = async (req, res, next) => {
    try {
        const { id } = req.params;
        const posts = await Post.find({ creator: id }).sort({ createdAt: -1 })
        res.status(200).json(posts)
    } catch (error) {
        return next(new HttpError(error))
    }
}
















// ================================ Edit post
// PATCH : api/posts/:id
// PROTECTED

const editPost = async (req, res, next) => {
    try {
        const postId = req.params.id;
        const { title, category, description } = req.body;

        // Validate input
        if (!title || !category || description.length < 12) {
            return next(new HttpError("Fill in all fields", 422));
        }

        // Get old post from database
        const oldPost = await Post.findById(postId);
        if (!oldPost) {
            return next(new HttpError("Post not found", 404));
        }

        // Check if the user is the creator of the post
        if (req.user.id !== oldPost.creator.toString()) {
            return next(new HttpError("Not authorized", 403));
        }

        let updatedPost;
        if (!req.files) {
            // Update post without changing the thumbnail
            updatedPost = await Post.findByIdAndUpdate(
                postId,
                { title, category, description },
                { new: true }
            );
        } else {
            // Delete old thumbnail
            const oldThumbnailPath = path.join(__dirname, '..', 'uploads', oldPost.thumbnail);
            fs.unlink(oldThumbnailPath, async (err) => {
                if (err) {
                    return next(new HttpError("Error deleting old thumbnail", 500));
                }
            });

            // Upload new thumbnail
            const { thumbnail } = req.files;

            // Check file size
            if (thumbnail.size > 2000000) {
                return next(new HttpError("Thumbnail too big. Should be less than 2mb", 413));
            }

            const fileName = thumbnail.name;
            const splittedFilename = fileName.split('.');
            const newFilename = `${splittedFilename[0]}${uuid()}.${splittedFilename[splittedFilename.length - 1]}`;

            // Move the new thumbnail to the uploads directory
            thumbnail.mv(path.join(__dirname, '..', 'uploads', newFilename), async (err) => {
                if (err) {
                    return next(new HttpError("Error uploading new thumbnail", 500));
                }
            });

            // Update post with the new thumbnail
            updatedPost = await Post.findByIdAndUpdate(
                postId,
                { title, category, description, thumbnail: newFilename },
                { new: true }
            );
        }

        if (!updatedPost) {
            return next(new HttpError("Couldn't update post.", 400));
        }

        res.status(200).json(updatedPost);
    } catch (error) {
        return next(new HttpError("Server error", 500));
    }
};











// ================================ Delete post
// DELETE : api/posts
// PROTECTED

const deletePost = async (req, res, next) => {

    try {
        const postId = req.params.id;
        if (!postId) {
            return next(new HttpError("Post unavailable.", 400))
        }
        const post = await Post.findById(postId);
        const fileName = post?.thumbnail;
        if (req.user.id == post.creator) {
            // delete thumbnail from uploads folder
            fs.unlink(path.join(__dirname, '..', 'uploads', fileName), async (err) => {
                if (err) {
                    return next(new HttpError(err))
                } else {
                    await Post.findByIdAndDelete(postId);
                    // find user and reduce post count by 1
                    const currentUser = await User.findById(req.user.id);
                    const userPostCount = currentUser?.posts - 1;
                    await User.findByIdAndUpdate(req.user.id, { posts: userPostCount })
                    res.json(`Post ${postId} deleted successfully`)
                }
                
            })
        } else {
            return next(new HttpError("Post couldn't be deleted", 403))
        }


    } catch (error) {
        return next(new HttpError(err))
    }

}







module.exports = { createPost, getPosts, getPost, getCatPosts, getUserPosts, editPost, deletePost }