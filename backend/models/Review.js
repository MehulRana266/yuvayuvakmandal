import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  id: { type: mongoose.Schema.Types.Mixed },
  name: { type: String, required: true },
  rating: { type: Number, default: 5 },
  comment: { type: String, required: true },
  location: { type: String, default: 'Surat Devotee' },
  date: { type: String }
}, { timestamps: true });

const Review = mongoose.model('Review', reviewSchema);
export default Review;
