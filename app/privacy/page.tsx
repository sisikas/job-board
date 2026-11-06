import type { Metadata } from "next";
import { LegalDocument, LegalLink, LegalMeta, MailLink } from "@/components/LegalDocument";

export const metadata: Metadata = {
  title: "Privacy policy — The Good Sort",
};

export default function PrivacyPage() {
  return (
    <LegalDocument title="Privacy policy">
      <p style={{ color: "#5C5140" }}>
        The Good Sort is a hand-picked culinary job board: we share jobs at good, independent
        kitchens with chefs and food professionals, on our site, by email and on Instagram. This
        policy explains what we collect, why, and the control you have. It was last updated on 6
        November 2026.
      </p>

      <h2>Who we are</h2>
      <p>
        The Good Sort is run by Stubborn Panda Ltd (&quot;we&quot;, &quot;us&quot;), a company
        registered in England and Wales under number 15721533. We are responsible for your personal
        data. You can reach us at <MailLink />.
      </p>

      <h2>What we collect</h2>
      <h3>If you&apos;re looking for work</h3>
      <ul>
        <li>Your email address when you create a free account.</li>
        <li>Your job alert choices: the roles and cities you want to hear about.</li>
      </ul>
      <h3>If you&apos;re hiring</h3>
      <ul>
        <li>Your business name, your name and contact email.</li>
        <li>The job details you send us: role, city, pay, description and how people should apply.</li>
        <li>Payment details for the £39 posting fee are handled by Stripe. We see that you paid, not your full card number.</li>
      </ul>
      <h3>Jobs we find</h3>
      <ul>
        <li>
          Some jobs we list come from posts businesses have shared publicly, for example on
          Instagram. From those we note the business name, location, role and the contact details
          the business published for applying.
        </li>
      </ul>
      <h3>Technical information</h3>
      <ul>
        <li>A sign-in session stored on your device so you stay signed in.</li>
        <li>
          Standard server logs kept by our hosting provider, such as IP address, browser or device
          type and time of request, used for security and troubleshooting.
        </li>
        <li>
          Usage data from Microsoft Clarity: which pages you visit, and recordings of how pages are
          scrolled, clicked and tapped, so we can see what&apos;s confusing and improve the site.
          Passwords and the details you type into forms are hidden from these recordings.
        </li>
      </ul>
      <p>We do not collect your contacts, sell your data, or show third-party ads on The Good Sort.</p>

      <h2>How we use it</h2>
      <ul>
        <li>To run The Good Sort: showing jobs, keeping your account and sending the job alerts you asked for.</li>
        <li>To review, publish and promote jobs that kitchens send us, on the site, in job alert emails and on our Instagram.</li>
        <li>To take payment for job posts and keep the records we need for accounting.</li>
        <li>To keep your account and the site secure.</li>
        <li>To understand how the site is used, so we can fix problems and improve it.</li>
        <li>To reply when you contact us.</li>
      </ul>
      <p>
        When you apply for a job, you apply to the business directly, using the email or link it
        gave. We don&apos;t pass your details to employers ourselves.
      </p>

      <h2>Legal basis</h2>
      <p>
        Under UK and EU data protection law we process your data to perform our agreement with you
        (providing the account, alerts or job post you signed up for), with your consent where we
        ask for it (for example, for analytics cookies), and for our legitimate interests in keeping
        The Good Sort secure and working properly, in understanding how it&apos;s used, and in
        listing jobs that businesses have advertised publicly.
      </p>

      <h2>Service providers</h2>
      <p>We use a small number of providers to run The Good Sort. They process data only on our instructions:</p>
      <ul>
        <li>Vercel: hosting for the website.</li>
        <li>Google (Gmail): sending job alert emails and replying to you.</li>
        <li>Microsoft Clarity: usage statistics and recordings of visits.</li>
        <li>Stripe: taking payment for job posts.</li>
        <li>Meta (Instagram): where we share jobs and run our own ads.</li>
      </ul>
      <p>
        Where a provider handles data outside the UK or EU, it is protected by safeguards such as
        the standard contractual clauses approved by the UK and the European Commission.
      </p>

      <h2>How long we keep it</h2>
      <p>
        We keep your account and alert choices for as long as you use The Good Sort. Job posts stay
        live for 30 days, and we keep a record of them and of payments for as long as the law
        requires for accounting.
      </p>
      <p>
        To delete your account and everything in it, email <MailLink /> and we will do it within 30
        days. You can stop job alerts at any time using the link in any alert email.
      </p>

      <h2>Your rights</h2>
      <p>You can ask us to:</p>
      <ul>
        <li>Give you a copy of your data.</li>
        <li>Correct anything that&apos;s wrong.</li>
        <li>Delete your data.</li>
        <li>Restrict or object to how we use it.</li>
      </ul>
      <p>
        Businesses can also ask us to take down a job we&apos;ve listed from a public post. Email{" "}
        <MailLink /> and we will reply within a month. If you are unhappy with how we handle your
        data, you can complain to the Information Commissioner&apos;s Office (ICO) in the UK, or
        your local data protection authority.
      </p>

      <h2>Age</h2>
      <p>
        The Good Sort is for adults. You must be 18 or over to create an account, sign up for job
        alerts or post a job.
      </p>

      <h2>Security</h2>
      <p>
        Data is encrypted in transit. No system is perfectly secure, but we take reasonable steps to
        protect your data and will tell you promptly if a breach affects you.
      </p>

      <h2>Cookies and local storage</h2>
      <p>
        The Good Sort stores what it needs to work, such as your sign-in session. Microsoft Clarity
        uses cookies to understand how the site is used; we only set these if you agree. We do not
        use advertising cookies.
      </p>

      <h2>Changes</h2>
      <p>
        If we change this policy, we will update the date at the top. If a change materially affects
        how we use your data, we will tell you by email or on the site before it takes effect.
      </p>

      <h2>Contact</h2>
      <p>
        Questions or requests: <MailLink />.
      </p>
      <LegalMeta>
        <LegalLink href="/terms">Terms of service</LegalLink>
      </LegalMeta>
    </LegalDocument>
  );
}
