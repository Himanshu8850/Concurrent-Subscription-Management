import mongoose from 'mongoose';

const { Schema } = mongoose;

const SubscriptionSchema = new Schema(
  {
    planId: {
      type: Schema.Types.ObjectId,
      ref: 'Plan',
      required: [true, 'Plan ID is required'],
      index: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
      required: [true, 'Customer ID is required'],
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'cancelled', 'expired', 'pending', 'failed'],
      default: 'pending',
      index: true,
    },
    startDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endDate: {
      type: Date,
      required: true,
    },
    paymentId: {
      type: String,
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'succeeded', 'failed', 'refunded'],
      default: 'pending',
    },
    amount_cents: {
      type: Number,
      required: true,
      min: 0,
    },
    autoRenew: {
      type: Boolean,
      default: false,
    },
    traceId: {
      type: String,
      index: true,
    },
    idempotencyKey: {
      type: String,
      index: true,
    },
    metadata: {
      type: Map,
      of: String,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
SubscriptionSchema.index({ customerId: 1, status: 1 });
SubscriptionSchema.index({ planId: 1, status: 1 });
SubscriptionSchema.index({ idempotencyKey: 1 }, { unique: true, sparse: true });

// Virtual: check if subscription is currently active
SubscriptionSchema.virtual('isActive').get(function () {
  const now = new Date();
  return this.status === 'active' && this.startDate <= now && this.endDate > now;
});

// Virtual: days remaining
SubscriptionSchema.virtual('daysRemaining').get(function () {
  const now = new Date();
  if (this.endDate < now) return 0;
  return Math.ceil((this.endDate - now) / (1000 * 60 * 60 * 24));
});

// Instance method: cancel subscription
SubscriptionSchema.methods.cancel = async function (session = null) {
  this.status = 'cancelled';
  return await this.save({ session });
};

// Instance method: activate subscription
SubscriptionSchema.methods.activate = async function (session = null) {
  this.status = 'active';
  this.paymentStatus = 'succeeded';
  return await this.save({ session });
};

// Instance method: mark as failed
SubscriptionSchema.methods.markFailed = async function (session = null) {
  this.status = 'failed';
  this.paymentStatus = 'failed';
  return await this.save({ session });
};

// Static method: find active subscriptions for a customer
SubscriptionSchema.statics.findActiveByCustomer = function (customerId) {
  const now = new Date();
  return this.find({
    customerId,
    status: 'active',
    startDate: { $lte: now },
    endDate: { $gt: now },
  })
    .populate('planId')
    .sort({ startDate: -1 });
};

// Static method: find subscriptions by idempotency key
SubscriptionSchema.statics.findByIdempotencyKey = function (key) {
  return this.findOne({ idempotencyKey: key });
};

const Subscription = mongoose.model('Subscription', SubscriptionSchema);

export default Subscription;
