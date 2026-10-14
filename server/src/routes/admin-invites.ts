import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../lib/supabase.js';
import { FRONTEND_URL } from '../lib/config.js';

export const adminInvitesRouter = Router();

/**
 * Middleware to verify admin/superadmin access
 */
async function requireAdmin(req: Request, res: Response, next: () => void) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Inloggning krävs' });
  }

  const token = authHeader.substring(7);

  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Ogiltig token' });
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'superadmin'].includes(profile.role)) {
      return res.status(403).json({ error: 'Administratörsbehörighet krävs' });
    }

    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(500).json({ error: 'Autentiseringen misslyckades' });
  }
}

const inviteSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(255),
});

/**
 * POST /api/admin/invites
 * Send an invite email via Supabase Auth. The invited user lands on
 * FRONTEND_URL/invite where they complete their account (password + username).
 * Re-inviting an address with a pending (unaccepted) invite resends the email.
 */
adminInvitesRouter.post('/', requireAdmin, async (req: Request, res: Response) => {
  const parsed = inviteSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Ogiltig e-postadress' });
  }

  const email = parsed.data.email;
  const redirectTo = `${FRONTEND_URL}/invite`;

  try {
    // Does a user with this email already exist?
    const { data: existing } = await supabaseAdmin
      .rpc('get_user_id_by_email', { user_email: email })
      .single<{ id: string; email: string }>();

    if (existing?.id) {
      const { data: userResult } = await supabaseAdmin.auth.admin.getUserById(existing.id);
      const existingUser = userResult?.user;

      if (existingUser && !existingUser.email_confirmed_at && existingUser.invited_at) {
        // Pending invite that was never accepted — remove it so the invite
        // can be sent again with a fresh link (the profile row cascades).
        await supabaseAdmin.auth.admin.deleteUser(existingUser.id);
      } else if (existingUser) {
        return res.status(409).json({ error: 'En användare med den här e-postadressen finns redan' });
      }
    }

    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo,
      data: { invited: true },
    });

    if (error) {
      console.error('[AdminInvites] Invite error:', error);
      if (error.status === 422 || (error as { code?: string }).code === 'email_exists') {
        return res.status(409).json({ error: 'En användare med den här e-postadressen finns redan' });
      }
      return res.status(500).json({ error: 'Det gick inte att skicka inbjudan' });
    }

    return res.json({ success: true, email, userId: data.user?.id });
  } catch (err) {
    console.error('[AdminInvites] Unexpected error:', err);
    return res.status(500).json({ error: 'Det gick inte att skicka inbjudan' });
  }
});
