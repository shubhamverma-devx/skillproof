import { failFromError, ok } from '@/lib/api-response';
import { listRoles } from '@/lib/dataset';

export async function GET() {
  try {
    return ok(listRoles());
  } catch (error) {
    return failFromError(error);
  }
}
