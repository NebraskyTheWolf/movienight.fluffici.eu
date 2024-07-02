import {Bitfield} from "@/lib/utils.ts";

/**
 * Adds the given permission to the current permissions.
 *
 * @param {number} currentPermissions - The current permissions.
 * @param {number} permissionToAdd - The permission to add.
 *
 * @return {number} - The updated permissions after adding the permission.
 */
export function addPermission(currentPermissions: Bitfield, permissionToAdd: Bitfield): number {
    return currentPermissions | permissionToAdd;
}

export function addPermissions(...permissionToAdd: number[]): number {
    let currentPermissions = 0;
    permissionToAdd.forEach(value => currentPermissions = currentPermissions | value)
    return currentPermissions;
}

/**
 * Removes a permission from the current permissions.
 *
 * @param {number} currentPermissions - The current permissions containing the permission to be removed.
 * @param {number} permissionToRemove - The permission to remove from the current permissions.
 *
 * @return {number} - The updated permissions after removing the specified permission.
 */
export function removePermission(currentPermissions: Bitfield, permissionToRemove: Bitfield): number {
    return currentPermissions & ~permissionToRemove;
}


export function hasPermissions(userPermissions: number, requiredPermissions: number): boolean {
    return (userPermissions & requiredPermissions) === requiredPermissions;
}
