function invitationQuery(supabase) {
  return supabase
    .from("guests")
    .select("id, full_name, party_size, rsvp_status, dietary_requirements, responded_at, guest_companions(id, full_name, rsvp_status, dietary_requirements)");
}

function safeInvitation(guest) {
  return {
    guest: {
      fullName: guest.full_name,
      partySize: guest.party_size,
      rsvpStatus: guest.rsvp_status,
      dietaryRequirements: guest.dietary_requirements,
      respondedAt: guest.responded_at,
    },
    companions: (guest.guest_companions || []).map((companion) => ({
      id: companion.id,
      fullName: companion.full_name,
      rsvpStatus: companion.rsvp_status,
      dietaryRequirements: companion.dietary_requirements,
    })),
  };
}

module.exports = { invitationQuery, safeInvitation };
