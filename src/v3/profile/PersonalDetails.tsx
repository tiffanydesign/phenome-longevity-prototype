import { useDataset } from "@/lib/data";
import { profileData, type ProfileUser } from "@/data/profile";
import { userStore } from "@/screens/profile/DetailScreens";
import { BackBar, BlurLayers, V2Screen } from "../ui/shell";
import { veilOnScroll } from "../devices/veil";
import { EditPill, Fields, Group, useEdit } from "./kit";
import "../devices/devices.css";
import "./profile.css";
import "./subpages.css";

/**
 * Personal details: the member at the top as on Profile, then the record in
 * three short groups, label at the left and value at the right. Edit turns the
 * values into fields in place; Done saves them. Email is the sign-in, so it
 * stays read-only here.
 */
export function PersonalDetails() {
  const d = useDataset(profileData);
  const e = useEdit<ProfileUser>(userStore.use() ?? d.user, userStore.set);
  const u = e.v;
  const initials = `${u.firstName[0] ?? ""}${u.lastName[0] ?? ""}`;

  return (
    <V2Screen nav={false}>
      <div className="v2-veil mx-veil dv-veil" data-at="status" aria-hidden>
        <BlurLayers />
      </div>
      <div className="dv scroll pf" onScroll={veilOnScroll}>
        <header className="dv-bar pf-bar">
          <BackBar />
          <EditPill editing={e.editing} onToggle={e.toggle} />
        </header>

        <section className="dd-hero">
          <span className="pf-avatar pf-avatar-lg" aria-hidden>
            {initials}
          </span>
          <h1>
            {u.firstName} {u.lastName}
          </h1>
          <p className="dv-state">{u.email}</p>
        </section>

        <Group title="Name">
          <Fields<ProfileUser> rows={[["First name", "firstName"], ["Last name", "lastName"]]} value={u} editing={e.editing} onChange={e.set} />
        </Group>
        <Group title="Sign-in" note="Your email is your sign-in, so it is changed through support.">
          <Fields<ProfileUser> rows={[["Email", "email"]]} value={u} editing={false} onChange={e.set} />
        </Group>
        <Group title="Body" note="Used to read your results against the right reference ranges.">
          <Fields<ProfileUser>
            rows={[
              ["Biological sex", "sex"],
              ["Date of birth", "dob"],
              ["Height", "height"],
              ["Weight", "weight"],
            ]}
            value={u}
            editing={e.editing}
            onChange={e.set}
          />
        </Group>

        <div className="dv-group pf-out">
          <button className="pf-row">
            <span className="pf-row-t">Deactivate account</span>
          </button>
        </div>
        <p className="dd-foot">Your clinic keeps your medical record as the law requires.</p>
      </div>
    </V2Screen>
  );
}
