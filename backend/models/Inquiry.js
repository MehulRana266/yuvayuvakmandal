import mongoose from 'mongoose';

const inquirySchema = new mongoose.Schema({
  id: { type: mongoose.Schema.Types.Mixed },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  subject: { type: String, default: 'General Inquiry' },
  message: { type: String, required: true },
  date: { type: String }
}, { timestamps: true });

const Inquiry = mongoose.model('Inquiry', inquirySchema);
export default Inquiry;
