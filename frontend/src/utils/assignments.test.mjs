// Run: node src/utils/assignments.test.mjs
import assert from 'node:assert';
import { currentAssignments, isCurrentAssignment } from './assignments.js';

const day = (offset) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d.toISOString().split('T')[0];
};

const base = { assignmentStatus: 'ACTIVE', projectStatus: 'ONGOING', endDate: day(30) };

assert.equal(isCurrentAssignment(base), true, 'active + open + future end is current');
assert.equal(isCurrentAssignment({ ...base, endDate: day(0) }), true, 'ends today is still current');
assert.equal(isCurrentAssignment({ ...base, endDate: day(-1) }), false, 'ended yesterday is not current');
assert.equal(isCurrentAssignment({ ...base, projectStatus: 'CLOSED' }), false, 'closed project is not current');
assert.equal(isCurrentAssignment({ ...base, assignmentStatus: 'RELEASED' }), false, 'released is not current');
assert.equal(isCurrentAssignment({ ...base, assignmentStatus: 'EXPIRED' }), false, 'expired is not current');
assert.equal(isCurrentAssignment(undefined), false, 'undefined is not current');

assert.equal(currentAssignments(undefined).length, 0, 'undefined list is empty');
assert.equal(currentAssignments([base, { ...base, projectStatus: 'CLOSED' }]).length, 1, 'filters the list');

console.log('assignments: all checks passed');
