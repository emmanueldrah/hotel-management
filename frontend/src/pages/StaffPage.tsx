import { useQuery } from '@tanstack/react-query';
import { fetchList } from '@/lib/queries';
import { Card, EmptyState, PageHeader, Spinner } from '@/components/ui';

interface Employee {
  id: string;
  employeeNo: string;
  firstName: string;
  lastName: string;
  position?: string;
  department?: string;
  email?: string;
  phone?: string;
}

export default function StaffPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['staff'],
    queryFn: () => fetchList<Employee>('/staff', { limit: 100 }),
  });

  const staff = data?.items ?? [];

  return (
    <div>
      <PageHeader title="Staff" subtitle="Employees and departments" />
      <Card className="overflow-x-auto p-0">
        {isLoading ? (
          <Spinner />
        ) : staff.length === 0 ? (
          <EmptyState message="No staff records yet." />
        ) : (
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
            <thead>
              <tr>
                <th className="th">Employee #</th>
                <th className="th">Name</th>
                <th className="th">Position</th>
                <th className="th">Department</th>
                <th className="th">Contact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {staff.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="td font-mono text-xs">{e.employeeNo}</td>
                  <td className="td font-medium">
                    {e.firstName} {e.lastName}
                  </td>
                  <td className="td">{e.position ?? '—'}</td>
                  <td className="td">{e.department ?? '—'}</td>
                  <td className="td text-xs">{e.email ?? e.phone ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
