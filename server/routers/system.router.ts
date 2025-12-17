import { publicProcedure, router } from '../_core/trpc';
import { z } from 'zod';

export const systemRouter = router({
  healthCheck: publicProcedure.query(() => 'OK'),
  // يمكن إضافة المزيد من الإجراءات هنا
});
