import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../lib/supabase.js';
import { FRONTEND_URL } from '../lib/config.js';

export const associationApplicationsRouter = Router();

/**
 * POST /api/associations/applications/:id/approve
 * Godkänner en medlemsansökan från medlemsportalen: skickar plattformens
 * inbjudningsmejl (eller lägger till ett befintligt konto direkt) och
 * registrerar personen som medlem i föreningen. Kräver att anroparen är
 * admin i den berörda föreningen eller plattformsadmin.
 */
associationApplicationsRouter.post('/:id/approve', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Inloggning krävs' });
  }

  try {
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
      authHeader.substring(7)
    );
    if (authError || !user) {
      return res.status(401).json({ error: 'Ogiltig token' });
    }

    const { data: application, error: appError } = await supabaseAdmin
      .from('member_applications')
      .select('id, association_id, name, email, status')
      .eq('id', req.params.id)
      .maybeSingle();

    if (appError) throw appError;
    if (!application) {
      return res.status(404).json({ error: 'Ansökan hittades inte' });
    }
    if (application.status !== 'pending') {
      return res.status(409).json({ error: 'Ansökan är redan hanterad' });
    }

    const { data: isAdmin, error: adminError } = await supabaseAdmin.rpc('is_association_admin', {
      assoc_id: application.association_id,
      user_uuid: user.id,
    });
    if (adminError) throw adminError;
    if (!isAdmin) {
      return res.status(403).json({ error: 'Föreningsadministratörsbehörighet krävs' });
    }

    const email = application.email.trim().toLowerCase();

    // Finns redan ett konto med den här e-postadressen?
    const { data: existing } = await supabaseAdmin
      .rpc('get_user_id_by_email', { user_email: email })
      .single<{ id: string; email: string }>();

    let memberUserId: string | null = null;
    let invited = false;

    if (existing?.id) {
      const { data: userResult } = await supabaseAdmin.auth.admin.getUserById(existing.id);
      const existingUser = userResult?.user;

      if (existingUser && !existingUser.email_confirmed_at && existingUser.invited_at) {
        // Väntande inbjudan som aldrig accepterats — ta bort så att en
        // färsk länk kan skickas (profilraden kaskaderas).
        await supabaseAdmin.auth.admin.deleteUser(existingUser.id);
      } else if (existingUser) {
        // Bekräftat konto: lägg till som medlem direkt, utan inbjudningsmejl
        memberUserId = existingUser.id;
      }
    }

    if (!memberUserId) {
      const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        redirectTo: `${FRONTEND_URL}/invite`,
        data: { invited: true },
      });
      if (error || !data.user) {
        console.error('[Applications] Invite error:', error);
        return res.status(500).json({ error: 'Det gick inte att skicka inbjudan' });
      }
      memberUserId = data.user.id;
      invited = true;
    }

    // Idempotent: personen kan redan vara medlem (t.ex. befintligt konto)
    const { error: memberError } = await supabaseAdmin
      .from('association_members')
      .upsert(
        { association_id: application.association_id, user_id: memberUserId, role: 'member' },
        { onConflict: 'association_id,user_id', ignoreDuplicates: true }
      );
    if (memberError) throw memberError;

    const { error: updateError } = await supabaseAdmin
      .from('member_applications')
      .update({ status: 'approved', handled_at: new Date().toISOString(), handled_by: user.id })
      .eq('id', application.id);
    if (updateError) throw updateError;

    return res.json({ success: true, invited });
  } catch (err) {
    console.error('[Applications] Unexpected error:', err);
    return res.status(500).json({ error: 'Ansökan kunde inte godkännas' });
  }
});
