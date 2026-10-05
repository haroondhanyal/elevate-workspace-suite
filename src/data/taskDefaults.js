const titles = [
  'Review the current sprint goals', 'Update the launch checklist', 'Prepare product release notes', 'Validate the signup experience', 'Review open customer feedback',
  'Draft acceptance criteria for account settings', 'Check responsive dashboard spacing', 'Confirm the payment error states', 'Review accessibility contrast', 'Update API integration notes',
  'Plan regression coverage for this release', 'Verify invitation email copy', 'Recheck the task creation flow', 'Review project board priorities', 'Prepare the stakeholder demo',
  'Triage reported browser issues', 'Confirm profile image upload limits', 'Update requirements traceability', 'Review pending approval requests', 'Export the monthly sales report',
  'Check notification delivery status', 'Organize the workspace help articles', 'Review test evidence attachments', 'Confirm mobile navigation behavior', 'Share sprint review outcomes',
]

export const initialTasks = titles.map((title, index) => ({
  id: index + 1,
  title,
  project: ['Elevate launch', 'Website refresh', 'Platform quality', 'Brand assets', 'Workspace rollout'][index % 5],
  person: ['AK', 'SM', 'YK', 'RH', 'JM'][index % 5],
  due: ['Today', 'Tomorrow', 'Oct 10', 'Oct 12', 'Oct 15'][index % 5],
  priority: ['High', 'Normal', 'Normal', 'Low', 'High'][index % 5],
  done: [3, 8, 14, 19].includes(index),
}))
