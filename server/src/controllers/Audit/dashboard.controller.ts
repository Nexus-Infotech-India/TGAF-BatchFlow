import { Request, Response } from 'express';
import { PrismaClient } from '../../generated/prisma';
import { AuditStatus, AuditType, FindingStatus, FindingType } from '../../generated/prisma';

const prisma = new PrismaClient();

export class AuditDashboardController {
  // Get audit overview statistics
  static async getAuditOverview(req: Request, res: Response) {
    try {
      const [
        totalAudits,
        activeAudits,
        completedAudits,
        plannedAudits,
        totalFindings,
        openFindings,
        criticalFindings,
        overdueActions
      ] = await Promise.all([
        // Total audits
        prisma.audit.count(),
        
        // Active audits (in progress)
        prisma.audit.count({
          where: { status: AuditStatus.IN_PROGRESS }
        }),
        
        // Completed audits
        prisma.audit.count({
          where: { status: AuditStatus.COMPLETED }
        }),
        
        // Planned audits
        prisma.audit.count({
          where: { status: AuditStatus.PLANNED }
        }),
        
        // Total findings
        prisma.finding.count(),
        
        // Open findings
        prisma.finding.count({
          where: { status: FindingStatus.OPEN }
        }),
        
        // Critical findings
        prisma.finding.count({
          where: { priority: 'CRITICAL' }
        }),
        
        // Overdue corrective actions
        prisma.correctiveAction.count({
          where: {
            dueDate: { lt: new Date() },
            status: { in: ['OPEN', 'IN_PROGRESS'] }
          }
        })
      ]);

      res.json({
        success: true,
        data: {
          totalAudits,
          activeAudits,
          completedAudits,
          plannedAudits,
          totalFindings,
          openFindings,
          criticalFindings,
          overdueActions,
          auditCompletionRate: totalAudits > 0 ? ((completedAudits / totalAudits) * 100).toFixed(1) : 0
        }
      });
    } catch (error) {
      console.error('Error fetching audit overview:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch audit overview',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Get audit status distribution
  static async getAuditStatusDistribution(req: Request, res: Response) {
    try {
      const statusDistribution = await prisma.audit.groupBy({
        by: ['status'],
        _count: {
          id: true
        }
      });

      const distribution = statusDistribution.map(item => ({
        status: item.status,
        count: item._count.id
      }));

      res.json({
        success: true,
        data: distribution
      });
    } catch (error) {
      console.error('Error fetching audit status distribution:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch audit status distribution',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Get findings by type distribution
  static async getFindingsDistribution(req: Request, res: Response) {
    try {
      const findingsDistribution = await prisma.finding.groupBy({
        by: ['findingType'],
        _count: {
          id: true
        }
      });

      const distribution = findingsDistribution.map(item => ({
        type: item.findingType,
        count: item._count.id
      }));

      res.json({
        success: true,
        data: distribution
      });
    } catch (error) {
      console.error('Error fetching findings distribution:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch findings distribution',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Get recent audits
  static async getRecentAudits(req: Request, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 5;

      const recentAudits = await prisma.audit.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          auditor: {
            select: { name: true, email: true }
          },
          auditee: {
            select: { name: true, email: true }
          },
          department: {
            select: { name: true }
          },
          _count: {
            select: {
              findings: true,
              actions: true
            }
          }
        }
      });

      res.json({
        success: true,
        data: recentAudits
      });
    } catch (error) {
      console.error('Error fetching recent audits:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch recent audits',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Get upcoming audits
  static async getUpcomingAudits(req: Request, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 5;

      const upcomingAudits = await prisma.audit.findMany({
        where: {
          startDate: { gte: new Date() },
          status: { in: [AuditStatus.PLANNED, AuditStatus.IN_PROGRESS] }
        },
        take: limit,
        orderBy: { startDate: 'asc' },
        include: {
          auditor: {
            select: { name: true, email: true }
          },
          auditee: {
            select: { name: true, email: true }
          },
          department: {
            select: { name: true }
          }
        }
      });

      res.json({
        success: true,
        data: upcomingAudits
      });
    } catch (error) {
      console.error('Error fetching upcoming audits:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch upcoming audits',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Get overdue actions
  static async getOverdueActions(req: Request, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 10;

      const overdueActions = await prisma.correctiveAction.findMany({
        where: {
          dueDate: { lt: new Date() },
          status: { in: ['OPEN', 'IN_PROGRESS'] }
        },
        take: limit,
        orderBy: { dueDate: 'asc' },
        include: {
          audit: {
            select: { name: true, id: true }
          },
          finding: {
            select: { title: true, priority: true }
          },
          assignedTo: {
            select: { name: true, email: true }
          }
        }
      });

      res.json({
        success: true,
        data: overdueActions
      });
    } catch (error) {
      console.error('Error fetching overdue actions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch overdue actions',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Get audit trends (monthly)
  static async getAuditTrends(req: Request, res: Response) {
    try {
      const { months = 6 } = req.query;
      const monthsBack = parseInt(months as string);
      
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - monthsBack);

      const auditTrends = await prisma.audit.groupBy({
        by: ['status'],
        where: {
          createdAt: { gte: startDate }
        },
        _count: {
          id: true
        }
      });

      // Get monthly breakdown
      const monthlyTrends = await prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('month', "createdAt") as month,
          status,
          COUNT(*)::int as count
        FROM "Audit"
        WHERE "createdAt" >= ${startDate}
        GROUP BY DATE_TRUNC('month', "createdAt"), status
        ORDER BY month DESC
      `;

      res.json({
        success: true,
        data: {
          overall: auditTrends,
          monthly: monthlyTrends
        }
      });
    } catch (error) {
      console.error('Error fetching audit trends:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch audit trends',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Get department-wise audit statistics
  static async getDepartmentAuditStats(req: Request, res: Response) {
    try {
      const departmentStats = await prisma.department.findMany({
        include: {
          audits: {
            include: {
              _count: {
                select: {
                  findings: true,
                  actions: true
                }
              }
            }
          }
        }
      });

      const stats = departmentStats.map(dept => ({
        departmentId: dept.id,
        departmentName: dept.name,
        totalAudits: dept.audits.length,
        completedAudits: dept.audits.filter(audit => audit.status === AuditStatus.COMPLETED).length,
        activeAudits: dept.audits.filter(audit => audit.status === AuditStatus.IN_PROGRESS).length,
        totalFindings: dept.audits.reduce((sum, audit) => sum + audit._count.findings, 0),
        totalActions: dept.audits.reduce((sum, audit) => sum + audit._count.actions, 0)
      }));

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error fetching department audit stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch department audit statistics',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Get auditor performance
  static async getAuditorPerformance(req: Request, res: Response) {
    try {
      const auditorPerformance = await prisma.auditor.findMany({
        include: {
          audits: {
            include: {
              _count: {
                select: {
                  findings: true,
                  actions: true
                }
              }
            }
          }
        }
      });

      const performance = auditorPerformance.map(auditor => ({
        auditorId: auditor.id,
        auditorName: auditor.name,
        email: auditor.email,
        isExternal: auditor.isExternal,
        firmName: auditor.firmName,
        totalAudits: auditor.audits.length,
        completedAudits: auditor.audits.filter(audit => audit.status === AuditStatus.COMPLETED).length,
        activeAudits: auditor.audits.filter(audit => audit.status === AuditStatus.IN_PROGRESS).length,
        totalFindings: auditor.audits.reduce((sum, audit) => sum + audit._count.findings, 0),
        averageFindingsPerAudit: auditor.audits.length > 0 
          ? (auditor.audits.reduce((sum, audit) => sum + audit._count.findings, 0) / auditor.audits.length).toFixed(2)
          : 0
      }));

      res.json({
        success: true,
        data: performance
      });
    } catch (error) {
      console.error('Error fetching auditor performance:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch auditor performance',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Get critical findings requiring immediate attention
  static async getCriticalFindings(req: Request, res: Response) {
    try {
      const criticalFindings = await prisma.finding.findMany({
        where: {
          priority: 'CRITICAL',
          status: { in: [FindingStatus.OPEN, FindingStatus.IN_PROGRESS] }
        },
        include: {
          audit: {
            select: { name: true, id: true }
          },
          assignedTo: {
            select: { name: true, email: true }
          },
          actions: {
            where: { status: { in: ['OPEN', 'IN_PROGRESS'] } },
            select: {
              id: true,
              title: true,
              dueDate: true,
              status: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      res.json({
        success: true,
        data: criticalFindings
      });
    } catch (error) {
      console.error('Error fetching critical findings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch critical findings',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Get comprehensive dashboard data
  static async getDashboardData(req: Request, res: Response) {
    try {
      const [
        overview,
        statusDistribution,
        findingsDistribution,
        recentAudits,
        upcomingAudits,
        overdueActions,
        criticalFindings
      ] = await Promise.all([
        AuditDashboardController.getOverviewData(),
        AuditDashboardController.getStatusDistributionData(),
        AuditDashboardController.getFindingsDistributionData(),
        AuditDashboardController.getRecentAuditsData(5),
        AuditDashboardController.getUpcomingAuditsData(5),
        AuditDashboardController.getOverdueActionsData(10),
        AuditDashboardController.getCriticalFindingsData()
      ]);

      res.json({
        success: true,
        data: {
          overview,
          statusDistribution,
          findingsDistribution,
          recentAudits,
          upcomingAudits,
          overdueActions,
          criticalFindings
        }
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch dashboard data',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Helper methods for dashboard data
  private static async getOverviewData() {
    const [
      totalAudits,
      activeAudits,
      completedAudits,
      plannedAudits,
      totalFindings,
      openFindings,
      criticalFindings,
      overdueActions
    ] = await Promise.all([
      prisma.audit.count(),
      prisma.audit.count({ where: { status: AuditStatus.IN_PROGRESS } }),
      prisma.audit.count({ where: { status: AuditStatus.COMPLETED } }),
      prisma.audit.count({ where: { status: AuditStatus.PLANNED } }),
      prisma.finding.count(),
      prisma.finding.count({ where: { status: FindingStatus.OPEN } }),
      prisma.finding.count({ where: { priority: 'CRITICAL' } }),
      prisma.correctiveAction.count({
        where: {
          dueDate: { lt: new Date() },
          status: { in: ['OPEN', 'IN_PROGRESS'] }
        }
      })
    ]);

    return {
      totalAudits,
      activeAudits,
      completedAudits,
      plannedAudits,
      totalFindings,
      openFindings,
      criticalFindings,
      overdueActions,
      auditCompletionRate: totalAudits > 0 ? ((completedAudits / totalAudits) * 100).toFixed(1) : 0
    };
  }

  private static async getStatusDistributionData() {
    const statusDistribution = await prisma.audit.groupBy({
      by: ['status'],
      _count: { id: true }
    });

    return statusDistribution.map(item => ({
      status: item.status,
      count: item._count.id
    }));
  }

  private static async getFindingsDistributionData() {
    const findingsDistribution = await prisma.finding.groupBy({
      by: ['findingType'],
      _count: { id: true }
    });

    return findingsDistribution.map(item => ({
      type: item.findingType,
      count: item._count.id
    }));
  }

  private static async getRecentAuditsData(limit: number) {
    return await prisma.audit.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        auditor: { select: { name: true, email: true } },
        auditee: { select: { name: true, email: true } },
        department: { select: { name: true } },
        _count: { select: { findings: true, actions: true } }
      }
    });
  }

  private static async getUpcomingAuditsData(limit: number) {
    return await prisma.audit.findMany({
      where: {
        startDate: { gte: new Date() },
        status: { in: [AuditStatus.PLANNED, AuditStatus.IN_PROGRESS] }
      },
      take: limit,
      orderBy: { startDate: 'asc' },
      include: {
        auditor: { select: { name: true, email: true } },
        auditee: { select: { name: true, email: true } },
        department: { select: { name: true } }
      }
    });
  }

  private static async getOverdueActionsData(limit: number) {
    return await prisma.correctiveAction.findMany({
      where: {
        dueDate: { lt: new Date() },
        status: { in: ['OPEN', 'IN_PROGRESS'] }
      },
      take: limit,
      orderBy: { dueDate: 'asc' },
      include: {
        audit: { select: { name: true, id: true } },
        finding: { select: { title: true, priority: true } },
        assignedTo: { select: { name: true, email: true } }
      }
    });
  }

  private static async getCriticalFindingsData() {
    return await prisma.finding.findMany({
      where: {
        priority: 'CRITICAL',
        status: { in: [FindingStatus.OPEN, FindingStatus.IN_PROGRESS] }
      },
      include: {
        audit: { select: { name: true, id: true } },
        assignedTo: { select: { name: true, email: true } },
        actions: {
          where: { status: { in: ['OPEN', 'IN_PROGRESS'] } },
          select: { id: true, title: true, dueDate: true, status: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}