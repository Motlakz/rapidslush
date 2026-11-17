import type { ReactNode } from 'react';

import { site } from '@/lib/site';
import { SiteFooter } from './SiteFooter';
import { SiteNav } from './SiteNav';

/** A policy page: the site's nav and footer around one readable column (the home page's sections link back with "/#id"). */
export function DocPage({ title, lead, children }: { title: string; lead: ReactNode; children: ReactNode }) {
  return (
    <>
      <SiteNav home="/" />
      <main id="top">
        <section className="section--doc" aria-labelledby="doc-h">
          <div className="wrap">
            <article className="doc measure">
              <h1 id="doc-h">{title}</h1>
              <p className="t-lead">{lead}</p>
              <p className="t-small muted">Last updated {site.updated}</p>
              {children}
            </article>
          </div>
        </section>
      </main>
      <SiteFooter home="/" />
    </>
  );
}

/** One titled part of a policy. */
export function Part({ id, title, children }: { id?: string; title: string; children: ReactNode }) {
  return (
    <section className="doc__part" id={id} aria-labelledby={id ? `${id}-h` : undefined}>
      <h2 id={id ? `${id}-h` : undefined}>{title}</h2>
      {children}
    </section>
  );
}
