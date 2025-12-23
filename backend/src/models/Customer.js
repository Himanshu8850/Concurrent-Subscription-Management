import mongoose from 'mongoose';

const { Schema } = mongoose;

const CustomerSchema = new Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name must be less than 100 characters'],
    },
    phone: {
      type: String,
      trim: true,
    },
    paymentMethods: [
      {
        id: String,
        type: {
          type: String,
          enum: ['card', 'bank_account', 'wallet'],
        },
        last4: String,
        isDefault: {
          type: Boolean,
          default: false,
        },
      },
    ],
    status: {
      type: String,
      enum: ['active', 'suspended', 'deleted'],
      default: 'active',
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

// Indexes
CustomerSchema.index({ email: 1 }, { unique: true });
CustomerSchema.index({ status: 1 });

// Instance method: add payment method
CustomerSchema.methods.addPaymentMethod = function (paymentMethod) {
  // If this is the first payment method, make it default
  if (this.paymentMethods.length === 0) {
    paymentMethod.isDefault = true;
  }
  this.paymentMethods.push(paymentMethod);
  return this.save();
};

// Instance method: get default payment method
CustomerSchema.methods.getDefaultPaymentMethod = function () {
  return this.paymentMethods.find(pm => pm.isDefault);
};

const Customer = mongoose.model('Customer', CustomerSchema);

export default Customer;
