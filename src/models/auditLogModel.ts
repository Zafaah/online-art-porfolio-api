import   mongoose  from "mongoose";


const auditLogSchema = new mongoose.Schema({
   userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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
      enum: ['ArtsWork', 'Commission', 'User','Artist'],
      required: true,
   },
   timestamp: {
      type: Date,
      required: true,
   }
})


export const AuditLogModel = mongoose.model('AuditLog', auditLogSchema);

