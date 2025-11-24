import   mongoose  from "mongoose";


const auditLogSchema = new mongoose.Schema({
   userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false, 
   },
   action: {
      type: String,
      required: true,
   },
   entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'entityType'
   },
   entityType: {
      type: String,
      enum: ['ArtsWork', 'Commission', 'User', 'Artist', 'Job'],
      required: true,
   },
   oldValue: {
      type: mongoose.Schema.Types.Mixed,
      required: false,
   },
   newValue: {
      type: mongoose.Schema.Types.Mixed,
      required: false,
   },
   metadata: {
      type: mongoose.Schema.Types.Mixed,
      required: false,
   },
   timestamp: {
      type: Date,
      required: true,
      default: Date.now,
   }
})


export const AuditLogModel = mongoose.model('AuditLog', auditLogSchema);

