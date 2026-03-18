import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.78.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supa = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // Verify the requesting user is an admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user: requestingUser }, error: authError } = await supa.auth.getUser(token)

    if (authError || !requestingUser) {
      console.error('Auth error:', authError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if requesting user is admin
    const { data: roleData, error: roleError } = await supa
      .from('user_roles')
      .select('role')
      .eq('user_id', requestingUser.id)
      .maybeSingle()

    if (roleError || !roleData || roleData.role !== 'admin') {
      console.error('Role check failed:', roleError, roleData)
      return new Response(
        JSON.stringify({ error: 'Only admins can sync users' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // List all current auth users (first 1000)
    const { data: listRes, error: listErr } = await supa.auth.admin.listUsers({ page: 1, perPage: 1000 })
    if (listErr) {
      console.error('List users error:', listErr)
      return new Response(
        JSON.stringify({ error: 'Failed to list auth users' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const authIds = new Set((listRes?.users ?? []).map((u: any) => u.id))

    // Fetch profiles and roles in parallel
    const [profilesRes, rolesRes] = await Promise.all([
      supa.from('profiles').select('id,user_id,email,full_name,eselon_iii,eselon_iv,created_at'),
      supa.from('user_roles').select('user_id,role'),
    ])

    if (profilesRes.error) throw profilesRes.error
    if (rolesRes.error) throw rolesRes.error

    const profiles = profilesRes.data ?? []
    const roles = rolesRes.data ?? []

    // Find orphan records (profiles without matching auth user)
    const orphanIds = profiles
      .filter((p: any) => !authIds.has(p.user_id))
      .map((p: any) => p.user_id)

    let deletedProfiles = 0
    let deletedRoles = 0

    if (orphanIds.length > 0) {
      const [{ data: delProf, error: delProfErr }, { data: delRoles, error: delRolesErr }] = await Promise.all([
        supa.from('profiles').delete().in('user_id', orphanIds).select('id'),
        supa.from('user_roles').delete().in('user_id', orphanIds).select('user_id'),
      ])
      if (delProfErr) throw delProfErr
      if (delRolesErr) throw delRolesErr
      deletedProfiles = delProf?.length ?? 0
      deletedRoles = delRoles?.length ?? 0
    }

    // Build fresh users list (filter out any remaining orphans just in case)
    const filteredProfiles = profiles.filter((p: any) => authIds.has(p.user_id))
    const users = filteredProfiles.map((p: any) => ({
      ...p,
      role: (roles.find((r: any) => r.user_id === p.user_id)?.role) ?? null,
    }))

    return new Response(
      JSON.stringify({
        success: true,
        deleted: { profiles: deletedProfiles, roles: deletedRoles },
        users,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})