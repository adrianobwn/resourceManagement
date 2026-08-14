// An assignment counts as "current" only while it is ACTIVE, its project is still
// open, and its end date has not passed.
export const isCurrentAssignment = (a) => {
    if (!a || a.assignmentStatus !== 'ACTIVE' || a.projectStatus === 'CLOSED') return false;
    const end = new Date(a.endDate);
    end.setHours(23, 59, 59, 999); // ponytail: local dates, no TZ handling until the API sends offsets
    return end >= new Date();
};

export const currentAssignments = (assignments) => (assignments || []).filter(isCurrentAssignment);
