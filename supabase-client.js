const SUPABASE_URL = "https://hjdcaszrklttanplobrk.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_29gZsZOawCBoaIWbKTSyRw_b6Y9O2p1";
const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
);

const LOGIN_PAGE = "index.html";
const ALLOWED_ROLES = new Set(["admin", "staff"]);

async function getAuthenticatedProfile() {
  const { data: authData, error: authError } =
    await supabaseClient.auth.getUser();

  if (authError) {
    throw authError;
  }

  if (!authData.user) {
    return null;
  }

  const { data: profile, error: profileError } = await supabaseClient
    .from("profiles")
    .select("full_name, role")
    .eq("user_id", authData.user.id)
    .maybeSingle();

  if (profileError) {
    throw profileError;
  }

  if (!profile || !ALLOWED_ROLES.has(profile.role)) {
    return null;
  }

  return { user: authData.user, profile };
}

function updateAuthenticatedUserDisplay(profile) {
  const fullName = profile.full_name || "VesselSync user";
  const role = profile.role === "admin" ? "Administrator" : "Staff";
  const initials = fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");

  document.querySelectorAll("[data-auth-full-name]").forEach((element) => {
    element.textContent = fullName;
  });
  document.querySelectorAll("[data-auth-role]").forEach((element) => {
    element.textContent = role;
  });
  document.querySelectorAll("[data-auth-initials]").forEach((element) => {
    element.textContent = initials;
  });
  document.querySelectorAll("[data-auth-first-name]").forEach((element) => {
    element.textContent = fullName.split(/\s+/)[0] || fullName;
  });
  document.querySelectorAll("[data-auth-user-menu]").forEach((element) => {
    element.setAttribute("aria-label", `Signed in as ${fullName}, ${role}`);
  });
}

async function initializeProtectedPage() {
  try {
    const authenticatedProfile = await getAuthenticatedProfile();

    if (!authenticatedProfile) {
      window.location.replace(LOGIN_PAGE);
      return null;
    }

    updateAuthenticatedUserDisplay(authenticatedProfile.profile);
    return authenticatedProfile;
  } catch (error) {
    console.error("Unable to initialize the authenticated page.", error);
    window.location.replace(LOGIN_PAGE);
    return null;
  }
}

function initializeLogoutButtons() {
  document.querySelectorAll("[data-logout]").forEach((button) => {
    button.addEventListener("click", async (event) => {
      event.preventDefault();
      button.setAttribute("aria-busy", "true");
      button.setAttribute("aria-disabled", "true");

      try {
        const { error } = await supabaseClient.auth.signOut();

        if (error) {
          throw error;
        }

        window.location.assign(LOGIN_PAGE);
      } catch (error) {
        console.error("Unable to sign out.", error);
        button.removeAttribute("aria-busy");
        button.removeAttribute("aria-disabled");
        window.alert("Logout failed. Please try again.");
      }
    });
  });
}
