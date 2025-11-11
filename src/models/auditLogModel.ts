import   mongoose  from "mongoose";


export interface AuditLog {
   userId: mongoose.Types.ObjectId;
   action: string;
   entityId: mongoose.Types.ObjectId;
   entityType: 'ArtsWork' | 'Commission' | 'User';
   timestamp: Date;
}

const auditLogSchema = new mongoose.Schema<AuditLog>({
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
      enum: ['ArtsWork', 'Commission', 'User'],
      required: true,
   },
   timestamp: {
      type: Date,
      required: true,
   }
})
export const AuditLogModel = mongoose.model<AuditLog>('AuditLog', auditLogSchema);

