import { PrismaClient } from '../../generated/prisma';

const prisma = new PrismaClient();

/**
 * Standalone script to reset all database data including user-related data
 */
async function resetDatabase(): Promise<void> {
  try {
    console.log('Starting complete database reset operation (including user data)');

    console.log('Deleting records from tables in proper order...');
    
    // Delete in order to respect foreign key constraints
    // Training module data
    await prisma.trainingSessionPhoto.deleteMany().catch(() => console.log('No TrainingSessionPhoto records to delete'));
    await prisma.feedbackForm.deleteMany().catch(() => console.log('No FeedbackForm records to delete'));
    await prisma.trainingInviteToken.deleteMany().catch(() => console.log('No TrainingInviteToken records to delete'));
    await prisma.trainingNotification.deleteMany().catch(() => console.log('No TrainingNotification records to delete'));
    await prisma.trainingFollowup.deleteMany().catch(() => console.log('No TrainingFollowup records to delete'));
    await prisma.trainingPhoto.deleteMany().catch(() => console.log('No TrainingPhoto records to delete'));
    await prisma.trainingFeedback.deleteMany().catch(() => console.log('No TrainingFeedback records to delete'));
    await prisma.attendance.deleteMany().catch(() => console.log('No Attendance records to delete'));
    await prisma.trainingParticipant.deleteMany().catch(() => console.log('No TrainingParticipant records to delete'));
    await prisma.trainingDocument.deleteMany().catch(() => console.log('No TrainingDocument records to delete'));
    await prisma.trainingSession.deleteMany().catch(() => console.log('No TrainingSession records to delete'));
    await prisma.training.deleteMany().catch(() => console.log('No Training records to delete'));
    await prisma.trainingCalendar.deleteMany().catch(() => console.log('No TrainingCalendar records to delete'));
    await prisma.participant.deleteMany().catch(() => console.log('No Participant records to delete'));

    // Audit module data
    await prisma.auditNotification.deleteMany().catch(() => console.log('No AuditNotification records to delete'));
    await prisma.auditReminder.deleteMany().catch(() => console.log('No AuditReminder records to delete'));
    await prisma.preAuditChecklistItem.deleteMany().catch(() => console.log('No PreAuditChecklistItem records to delete'));
    await prisma.auditDocument.deleteMany().catch(() => console.log('No AuditDocument records to delete'));
    await prisma.correctiveAction.deleteMany().catch(() => console.log('No CorrectiveAction records to delete'));
    await prisma.finding.deleteMany().catch(() => console.log('No Finding records to delete'));
    await prisma.auditInspectionItem.deleteMany().catch(() => console.log('No AuditInspectionItem records to delete'));
    await prisma.audit.deleteMany().catch(() => console.log('No Audit records to delete'));
    await prisma.department.deleteMany().catch(() => console.log('No Department records to delete'));
    await prisma.auditor.deleteMany().catch(() => console.log('No Auditor records to delete'));

    // Batch flow data
    await prisma.batchParameterValue.deleteMany().catch(() => console.log('No BatchParameterValue records to delete'));
    await prisma.notification.deleteMany().catch(() => console.log('No Notification records to delete'));
    await prisma.activityLog.deleteMany().catch(() => console.log('No ActivityLog records to delete'));
    await prisma.batch.deleteMany().catch(() => console.log('No Batch records to delete'));
    await prisma.standardDefinition.deleteMany().catch(() => console.log('No StandardDefinition records to delete'));
    await prisma.standardParameter.deleteMany().catch(() => console.log('No StandardParameter records to delete'));
    await prisma.standard.deleteMany().catch(() => console.log('No Standard records to delete'));
    await prisma.productParameter.deleteMany().catch(() => console.log('No ProductParameter records to delete'));
    await prisma.productStandardCategory.deleteMany().catch(() => console.log('No ProductStandardCategory records to delete'));
    await prisma.standardCategory.deleteMany().catch(() => console.log('No StandardCategory records to delete'));
    await prisma.methodology.deleteMany().catch(() => console.log('No Methodology records to delete'));
    await prisma.unitOfMeasurement.deleteMany().catch(() => console.log('No UnitOfMeasurement records to delete'));
    await prisma.product.deleteMany().catch(() => console.log('No Product records to delete'));
    await prisma.exportLog.deleteMany().catch(() => console.log('No ExportLog records to delete'));
    
    // User-related data
    await prisma.user.deleteMany().catch(() => console.log('No User records to delete'));
    await prisma.role.deleteMany().catch(() => console.log('No Role records to delete'));
    await prisma.permission.deleteMany().catch(() => console.log('No Permission records to delete'));
    
    console.log('Resetting auto-increment sequences...');
    
    // Reset sequences for tables that might have auto-incrementing IDs
    // Note: Most of your tables use UUID, but some might have sequences
    const sequenceResets = [
      'SELECT setval(pg_get_serial_sequence(\'"User"\', \'id\'), 1, false)',
      'SELECT setval(pg_get_serial_sequence(\'"Role"\', \'id\'), 1, false)',
      'SELECT setval(pg_get_serial_sequence(\'"Permission"\', \'id\'), 1, false)',
      'SELECT setval(pg_get_serial_sequence(\'"Product"\', \'id\'), 1, false)',
      'SELECT setval(pg_get_serial_sequence(\'"StandardCategory"\', \'id\'), 1, false)',
      'SELECT setval(pg_get_serial_sequence(\'"StandardParameter"\', \'id\'), 1, false)',
      'SELECT setval(pg_get_serial_sequence(\'"Standard"\', \'id\'), 1, false)',
      'SELECT setval(pg_get_serial_sequence(\'"StandardDefinition"\', \'id\'), 1, false)',
      'SELECT setval(pg_get_serial_sequence(\'"UnitOfMeasurement"\', \'id\'), 1, false)',
      'SELECT setval(pg_get_serial_sequence(\'"Methodology"\', \'id\'), 1, false)',
      'SELECT setval(pg_get_serial_sequence(\'"Batch"\', \'id\'), 1, false)',
      'SELECT setval(pg_get_serial_sequence(\'"BatchParameterValue"\', \'id\'), 1, false)',
      'SELECT setval(pg_get_serial_sequence(\'"ExportLog"\', \'id\'), 1, false)'
    ];

    for (const query of sequenceResets) {
      try {
        await prisma.$executeRawUnsafe(query);
      } catch (error) {
        console.log(`Sequence reset query failed (might not exist): ${query}`);
      }
    }
    
    console.log('Complete database reset completed successfully (including user data)');
  } catch (error) {
    console.error('Error resetting database:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Execute the function when this file is run directly
resetDatabase()
  .then(() => {
    console.log('Script execution complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });