/**
 * Permissions System - Role-based access control (RBAC) with granular permissions
 */

export enum UserRole {
  ADMIN = 'admin',
  INSTRUCTOR = 'instructor',
  STUDENT = 'student',
  GUEST = 'guest',
}

export interface Permission {
  resource: string;
  action: string;
  conditions?: Record<string, any>;
}

export interface Role {
  name: UserRole;
  permissions: Permission[];
  inherits?: UserRole[];
}

class PermissionSystem {
  private roles: Map<UserRole, Role> = new Map();

  constructor() {
    this.initializeDefaultRoles();
  }

  /**
   * Initialize default roles and permissions
   */
  private initializeDefaultRoles(): void {
    // Admin - full access
    this.defineRole({
      name: UserRole.ADMIN,
      permissions: [
        { resource: '*', action: '*' }, // Wildcard permission
      ],
    });

    // Instructor - can manage own courses
    this.defineRole({
      name: UserRole.INSTRUCTOR,
      permissions: [
        { resource: 'course', action: 'create' },
        { resource: 'course', action: 'read', conditions: { ownedBy: 'self' } },
        { resource: 'course', action: 'update', conditions: { ownedBy: 'self' } },
        { resource: 'course', action: 'delete', conditions: { ownedBy: 'self' } },
        { resource: 'section', action: 'create', conditions: { courseOwnedBy: 'self' } },
        { resource: 'section', action: 'update', conditions: { courseOwnedBy: 'self' } },
        { resource: 'section', action: 'delete', conditions: { courseOwnedBy: 'self' } },
        { resource: 'lesson', action: 'create', conditions: { courseOwnedBy: 'self' } },
        { resource: 'lesson', action: 'update', conditions: { courseOwnedBy: 'self' } },
        { resource: 'lesson', action: 'delete', conditions: { courseOwnedBy: 'self' } },
        { resource: 'pdf', action: 'create', conditions: { courseOwnedBy: 'self' } },
        { resource: 'pdf', action: 'read' },
        { resource: 'pdf', action: 'delete', conditions: { uploadedBy: 'self' } },
        { resource: 'analytics', action: 'read', conditions: { courseOwnedBy: 'self' } },
      ],
    });

    // Student - can read content and track progress
    this.defineRole({
      name: UserRole.STUDENT,
      permissions: [
        { resource: 'course', action: 'read', conditions: { enrolled: true } },
        { resource: 'section', action: 'read', conditions: { courseEnrolled: true } },
        { resource: 'lesson', action: 'read', conditions: { courseEnrolled: true } },
        { resource: 'pdf', action: 'read' },
        { resource: 'progress', action: 'read', conditions: { ownedBy: 'self' } },
        { resource: 'progress', action: 'update', conditions: { ownedBy: 'self' } },
        { resource: 'enrollment', action: 'read', conditions: { ownedBy: 'self' } },
      ],
    });

    // Guest - limited read access
    this.defineRole({
      name: UserRole.GUEST,
      permissions: [
        { resource: 'course', action: 'read' },
      ],
    });
  }

  /**
   * Define a new role
   */
  defineRole(role: Role): void {
    this.roles.set(role.name, role);
  }

  /**
   * Check if user can perform action
   */
  can(
    userRole: UserRole,
    resource: string,
    action: string,
    context?: Record<string, any>
  ): boolean {
    const role = this.roles.get(userRole);
    if (!role) return false;

    // Check direct permissions
    for (const permission of role.permissions) {
      if (this.matchesPermission(permission, resource, action, context)) {
        return true;
      }
    }

    // Check inherited roles
    if (role.inherits) {
      for (const inheritedRole of role.inherits) {
        if (this.can(inheritedRole, resource, action, context)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Check if permission matches request
   */
  private matchesPermission(
    permission: Permission,
    resource: string,
    action: string,
    context?: Record<string, any>
  ): boolean {
    // Check resource match
    const resourceMatch = permission.resource === '*' || permission.resource === resource;
    if (!resourceMatch) return false;

    // Check action match
    const actionMatch = permission.action === '*' || permission.action === action;
    if (!actionMatch) return false;

    // Check conditions
    if (permission.conditions && context) {
      for (const [key, value] of Object.entries(permission.conditions)) {
        if (value === 'self') {
          if (context[key] !== context.userId) return false;
        } else if (typeof value === 'boolean') {
          if (context[key] !== value) return false;
        } else if (Array.isArray(value)) {
          if (!value.includes(context[key])) return false;
        } else {
          if (context[key] !== value) return false;
        }
      }
    }

    return true;
  }

  /**
   * Get all permissions for a role
   */
  getPermissions(role: UserRole): Permission[] {
    const roleData = this.roles.get(role);
    if (!roleData) return [];

    let permissions = [...roleData.permissions];

    // Add inherited permissions
    if (roleData.inherits) {
      roleData.inherits.forEach(inheritedRole => {
        permissions = [...permissions, ...this.getPermissions(inheritedRole)];
      });
    }

    return permissions;
  }

  /**
   * Check multiple permissions (AND logic)
   */
  canAll(
    userRole: UserRole,
    checks: Array<{ resource: string; action: string; context?: Record<string, any> }>
  ): boolean {
    return checks.every(check =>
      this.can(userRole, check.resource, check.action, check.context)
    );
  }

  /**
   * Check multiple permissions (OR logic)
   */
  canAny(
    userRole: UserRole,
    checks: Array<{ resource: string; action: string; context?: Record<string, any> }>
  ): boolean {
    return checks.some(check =>
      this.can(userRole, check.resource, check.action, check.context)
    );
  }

  /**
   * Create custom permission
   */
  addPermission(role: UserRole, permission: Permission): void {
    const roleData = this.roles.get(role);
    if (roleData) {
      roleData.permissions.push(permission);
    }
  }

  /**
   * Remove permission
   */
  removePermission(role: UserRole, resource: string, action: string): void {
    const roleData = this.roles.get(role);
    if (roleData) {
      roleData.permissions = roleData.permissions.filter(
        p => !(p.resource === resource && p.action === action)
      );
    }
  }
}

// Singleton instance
export const permissionSystem = new PermissionSystem();

/**
 * Middleware to check permissions
 */
export const requirePermission = (resource: string, action: string) => {
  return (req: any, res: any, next: any) => {
    const userRole = req.user?.role || UserRole.GUEST;
    const context = {
      userId: req.user?.id,
      ...req.params,
      ...req.body,
    };

    if (!permissionSystem.can(userRole, resource, action, context)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `You don't have permission to ${action} ${resource}`,
      });
    }

    next();
  };
};

export default permissionSystem;
