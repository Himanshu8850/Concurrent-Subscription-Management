import mongoose from 'mongoose';

const { Schema } = mongoose;

const PlanSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Plan name is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Plan name must be at least 3 characters'],
      maxlength: [100, 'Plan name must be less than 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Plan description is required'],
      maxlength: [500, 'Description must be less than 500 characters'],
    },
    price_cents: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    duration_days: {
      type: Number,
      required: true,
      default: 30,
      min: [1, 'Duration must be at least 1 day'],
    },
    total_capacity: {
      type: Number,
      required: [true, 'Total capacity is required'],
      min: [1, 'Capacity must be at least 1'],
    },
    subscriptions_left: {
      type: Number,
      required: true,
      min: [0, 'Subscriptions left cannot be negative'],
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'archived'],
      default: 'active',
    },
    features: [
      {
        type: String,
      },
    ],
    metadata: {
      type: Map,
      of: String,
      default: {},
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
PlanSchema.index({ name: 1 }, { unique: true });
PlanSchema.index({ status: 1 });
PlanSchema.index({ subscriptions_left: 1 });

// Virtual: calculate if plan is sold out
PlanSchema.virtual('isSoldOut').get(function () {
  return this.subscriptions_left === 0;
});

// Virtual: calculate occupancy percentage
PlanSchema.virtual('occupancyPercentage').get(function () {
  if (this.total_capacity === 0) return 0;
  return ((this.total_capacity - this.subscriptions_left) / this.total_capacity) * 100;
});

// Pre-save validation: ensure subscriptions_left doesn't exceed capacity
PlanSchema.pre('save', function (next) {
  if (this.subscriptions_left > this.total_capacity) {
    next(new Error('Subscriptions left cannot exceed total capacity'));
  }
  next();
});

// Static method: atomically decrement subscription count
PlanSchema.statics.reserveSeat = async function (planId, session = null) {
  const options = session ? { session, new: true } : { new: true };

  const plan = await this.findOneAndUpdate(
    {
      _id: planId,
      subscriptions_left: { $gt: 0 },
      status: 'active',
    },
    {
      $inc: { subscriptions_left: -1 },
    },
    options
  );

  if (!plan) {
    throw new Error('PLAN_SOLD_OUT');
  }

  return plan;
};

// Static method: release a seat (rollback)
PlanSchema.statics.releaseSeat = async function (planId, session = null) {
  const options = session ? { session, new: true } : { new: true };

  return await this.findOneAndUpdate(
    {
      _id: planId,
      $expr: { $lt: ['$subscriptions_left', '$total_capacity'] },
    },
    {
      $inc: { subscriptions_left: 1 },
    },
    options
  );
};

const Plan = mongoose.model('Plan', PlanSchema);

export default Plan;
