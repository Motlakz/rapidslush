import { PlayButton } from './PlayButton';

/** The phone's action bar (system.md, Nav): the main action at the foot; with it, the nav's button moves into the menu sheet. */
export function ActionBar() {
  return (
    <nav className="actionbar" aria-label="Quick actions">
      <PlayButton compact />
    </nav>
  );
}
