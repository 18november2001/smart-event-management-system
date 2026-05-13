const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required']
  },
  category: {
    type: String,
    enum: ['conference', 'workshop', 'festival', 'private', 'other'],
    required: [true, 'Category is required']
  },
  date: {
    type: Date,
    required: [true, 'Event date is required']
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true
  },
  totalCapacity: {
    type: Number,
    required: [true, 'Total capacity is required'],
    min: [1, 'Capacity must be at least 1']
  },
  bookedCount: {
    type: Number,
    default: 0
  },
  ticketPrice: {
    type: Number,
    required: [true, 'Ticket price is required'],
    min: [0, 'Price cannot be negative']
  },
  imageUrl: {
    type: String,
    default: ''
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

// Virtual: available seats
eventSchema.virtual('availableSeats').get(function () {
  return this.totalCapacity - this.bookedCount;
});

// Virtual: is the event sold out
eventSchema.virtual('isSoldOut').get(function () {
  return this.bookedCount >= this.totalCapacity;
});

// Ensure virtuals are included when converting to JSON/object
eventSchema.set('toJSON', { virtuals: true });
eventSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Event', eventSchema);
