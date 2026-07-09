// app/(protected)/layout.tsx
//
// This layout wraps EVERY page inside the (protected) route group — i.e. all
// the player and coach pages. The parentheses around "(protected)" make it a
// Next.js "route group": it organizes files WITHOUT changing the URL. So
// app/(protected)/player/page.tsx is still served at "/player".
//
// This is the ONE place the login gate will live. Right now it just renders
// the page. Later, this is where we'll check "is the user logged in?" and, if
// not, redirect them to /login. Keeping that check in one shared layout means
// every protected page is covered automatically — you never have to remember
// to add it page by page.

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // TODO (when we wire auth): read the session here. If there's no logged-in
  // user, redirect("/login"). Until then, pages are open so we can build them.
  return <>{children}</>;
}
