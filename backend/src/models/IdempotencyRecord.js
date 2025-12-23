import mongoose from 'mongoose';

const { Schema } = mongoose;

const IdempotencyRecordSchema = new Schema(
  {
    key: {
      type: String,
      required: [true, 'Idempotency key is required'],
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['processing', 'completed', 'failed'],
      default: 'processing',
      index: true,
    },
    requestBody: {
      type: Schema.Types.Mixed,
      required: true,
    },
    responseBody: {
      type: Schema.Types.Mixed,
    },
    statusCode: {
      type: Number,
    },
    resourceId: {
      type: String,
      index: true,
    },
    resourceType: {
      type: String,
      enum: ['subscription', 'payment', 'refund'],
    },
    traceId: {
      type: String,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// TTL index - automatically delete expired records
IdempotencyRecordSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Static method: create or get existing record
IdempotencyRecordSchema.statics.createOrGet = async function (
  key,
  requestBody,
  traceId,
  ttlDays = 30
) {
  const existing = await this.findOne({ key });
  if (existing) {
    return { record: existing, isNew: false };
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + ttlDays);

  const record = await this.create({
    key,
    status: 'processing',
    requestBody,
    traceId,
    expiresAt,
  });

  return { record, isNew: true };
};

// Static method: mark as completed
IdempotencyRecordSchema.statics.markCompleted = async function (
  key,
  responseBody,
  statusCode,
  resourceId,
  resourceType
) {
  return await this.findOneAndUpdate(
    { key },
    {
      status: 'completed',
      responseBody,
      statusCode,
      resourceId,
      resourceType,
    },
    { new: true }
  );
};

// Static method: mark as failed
IdempotencyRecordSchema.statics.markFailed = async function (key, responseBody, statusCode) {
  return await this.findOneAndUpdate(
    { key },
    {
      status: 'failed',
      responseBody,
      statusCode,
    },
    { new: true }
  );
};

const IdempotencyRecord = mongoose.model('IdempotencyRecord', IdempotencyRecordSchema);

export default IdempotencyRecord;
