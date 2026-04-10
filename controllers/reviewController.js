const Review = require('../models/Review');
const Batch = require('../models/Batch');

const createReview = async (req, res, next) => {
    try {
        const { batchId, rating, comment } = req.body;
        const userId = req.user._id;

        // Kiểm tra batch tồn tại
        const batch = await Batch.findById(batchId);
        if (!batch) {
            return res.status(404).json({ message: 'Lô hàng không tồn tại' });
        }

        // Kiểm tra xem user đã review batch này chưa (nếu muốn mỗi user chỉ được review 1 lần)
        const existingReview = await Review.findOne({ batchId, userId });
        if (existingReview) {
            return res.status(400).json({ message: 'Bạn đã review lô hàng này rồi' });
        }

        const review = new Review({
            batchId,
            userId,
            rating,
            comment
        });

        await review.save();
        res.status(201).json(review);
    } catch (err) {
        next(err);
    }
};

const getReviewsByBatch = async (req, res, next) => {
    try {
        const { batchId } = req.params;
        const reviews = await Review.find({ batchId })
            .populate('userId', 'username')
            .sort('-createdAt');
        res.json(reviews);
    } catch (err) {
        next(err);
    }
};

const updateReview = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { rating, comment } = req.body;
        const userId = req.user._id;

        const review = await Review.findById(id);
        if (!review) {
            return res.status(404).json({ message: 'Không tìm thấy review' });
        }

        // Chỉ tác giả mới được sửa
        if (review.userId.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'Không có quyền sửa review này' });
        }

        review.rating = rating !== undefined ? rating : review.rating;
        review.comment = comment !== undefined ? comment : review.comment;
        await review.save();

        res.json(review);
    } catch (err) {
        next(err);
    }
};

const deleteReview = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;
        const userRole = req.user.role;

        const review = await Review.findById(id);
        if (!review) {
            return res.status(404).json({ message: 'Không tìm thấy review' });
        }

        // Admin có thể xóa bất kỳ, user chỉ xóa của mình
        if (userRole !== 'admin' && review.userId.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'Không có quyền xóa review này' });
        }

        await review.deleteOne();
        res.json({ message: 'Đã xóa review thành công' });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    createReview,
    getReviewsByBatch,
    updateReview,
    deleteReview
};