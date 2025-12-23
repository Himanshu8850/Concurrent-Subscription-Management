import mongoose from 'mongoose';

const { Schema } = mongoose;

const AuditLogSchema = new Schema(
  {
    traceId: {
      type: String,
      required: true,
      index: true,
    },
    actor: {
      type: Schema.Types.ObjectId,
      refPath: 'actorType',
      required: true,
      index: true,
    },
    actorType: {
      type: String,
      enum: ['Customer', 'Admin', 'System'],
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        'subscription.created',
        'subscription.activated',
        'subscription.cancelled',
        'subscription.failed',
        'plan.capacity_decreased',
        'plan.capacity_increased',
        'plan.created',
        'plan.updated',
        'payment.processed',
        'payment.failed',
        'payment.refunded',
      ],
      index: true,
    },
    resource: {
      type: String,
      required: true,
      index: true,
    },
    resourceType: {
      type: String,
      enum: ['Plan', 'Subscription', 'Payment', 'Customer'],
      required: true,
    },
    resourceId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    before: {
      type: Schema.Types.Mixed,
    },
    after: {
      type: Schema.Types.Mixed,
    },
    metadata: {
      type: Map,
      of: Schema.Types.Mixed,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for common queries
AuditLogSchema.index({ traceId: 1, createdAt: -1 });
AuditLogSchema.index({ resourceId: 1, resourceType: 1, createdAt: -1 });
AuditLogSchema.index({ actor: 1, actorType: 1, createdAt: -1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });

// Static method: log an action
AuditLogSchema.statics.logAction = async function ({
  traceId,
  actor,
  actorType,
  action,
  resource,
  resourceType,
  resourceId,
  before = null,
  after = null,
  metadata = {},
  ipAddress = null,
  userAgent = null,
  session = null,
}) {
  const logEntry = {
    traceId,
    actor,
    actorType,
    action,
    resource,
    resourceType,
    resourceId,
    before,
    after,
    metadata,
    ipAddress,
    userAgent,
  };

  if (session) {
    return await this.create([logEntry], { session });
  }
  return await this.create(logEntry);
};

// Static method: get audit trail for a resource
AuditLogSchema.statics.getResourceHistory = function (resourceType, resourceId, limit = 100) {
  return this.find({ resourceType, resourceId }).sort({ createdAt: -1 }).limit(limit).lean();
};

// Static method: get audit trail by trace ID
AuditLogSchema.statics.getByTraceId = function (traceId) {
  return this.find({ traceId }).sort({ createdAt: 1 }).lean();
};

const AuditLog = mongoose.model('AuditLog', AuditLogSchema);

export default AuditLog;
