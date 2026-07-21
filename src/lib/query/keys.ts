export const dashboardQueryKeys = {
  all: ['dashboard'] as const,
  snapshot: (locationId: string, businessDate?: string) =>
    [
      ...dashboardQueryKeys.all,
      'snapshot',
      locationId,
      businessDate ?? 'current',
    ] as const,
}
