import type { Metadata } from "next";
import { LegalDocument, LegalLink, LegalMeta, MailLink } from "@/components/LegalDocument";

export const metadata: Metadata = {
  title: "Terms of service — The Good Sort",
};

export default function TermsPage() {
  return (
    <LegalDocument title="Terms of service">
      <p style={{ color: "#5C5140" }}>
        These terms are the agreement between you and Stubborn Panda Ltd (company number 15721533,
        registered in England and Wales) for using The Good Sort. Please read them together with our{" "}
        <LegalLink href="/privacy">privacy policy</LegalLink>. They were last updated on 6 November
        2026.
      </p>

      <h2>Using The Good Sort</h2>
      <p>
        You must be 18 or over to use The Good Sort. By creating an account, signing up for job
        alerts or posting a job, you agree to these terms.
      </p>

      <h2>What we are, and what we&apos;re not</h2>
      <p>
        The Good Sort hand-picks and shares culinary jobs. We are not an employer or a recruitment
        agency, and we don&apos;t take part in hiring decisions. You apply to each business
        directly, and any job offer is between you and that business. We check the jobs we list, but
        we can&apos;t guarantee every detail, so please check the important things, like pay and
        hours, with the business before you accept a job.
      </p>

      <h2>Your account</h2>
      <p>
        You are responsible for what happens in your account. Tell us straight away if you think
        someone else has access to it. Job alerts are free, and you can stop them at any time using
        the link in any alert email.
      </p>

      <h2>Posting a job</h2>
      <ul>
        <li>Posting a job costs £39 per job, and it stays live for 30 days. There are no other fees and no subscription.</li>
        <li>You pay by card through Stripe when you post your job, and it goes live straight away.</li>
        <li>We may review any job and remove it if it breaks these terms or doesn&apos;t fit The Good Sort.</li>
        <li>We may make small edits so your job fits our style and is clear, without changing what it means.</li>
        <li>Approved jobs appear on the site, and may be shared in our job alert emails and on our Instagram.</li>
        <li>Job posts are non-refundable.</li>
      </ul>
      <p>When you post a job, you confirm that:</p>
      <ul>
        <li>It&apos;s a real, open job at your business, and the details are accurate.</li>
        <li>It follows employment law, including minimum wage and equality law, and doesn&apos;t discriminate.</li>
        <li>You&apos;ll handle applications fairly and do your own right-to-work checks.</li>
        <li>You have the right to share any text, logos or images you send us, and you let us show them to promote your job.</li>
      </ul>
      <p>We may remove a job that breaks these terms. Removed jobs are not refunded.</p>

      <h2>Jobs from public posts</h2>
      <p>
        Some jobs we list come from posts businesses have shared publicly. If you run a business and
        want us to change or remove a job we&apos;ve listed, email <MailLink /> and we&apos;ll sort
        it quickly.
      </p>

      <h2>Acceptable use</h2>
      <p>
        Don&apos;t misuse The Good Sort. That includes posting fake or misleading jobs, scraping or
        copying our listings in bulk, testing or bypassing our security, overloading the service, or
        using it to harass anyone.
      </p>

      <h2>Our content</h2>
      <p>
        The Good Sort name, logo, design and the way we write and present jobs belong to us. Please
        don&apos;t copy them without asking.
      </p>

      <h2>A young service</h2>
      <p>
        The Good Sort is new and still changing. We work hard to keep it running smoothly, but we
        can&apos;t promise it will always be available or free of errors. We may change or stop
        features.
      </p>

      <h2>Ending your use</h2>
      <p>
        You can stop using The Good Sort at any time and ask us to delete your account. We may
        suspend or close accounts that break these terms, and will tell you why unless the law
        prevents us.
      </p>

      <h2>Liability</h2>
      <p>
        The Good Sort is provided &quot;as is&quot;. To the extent the law allows, we are not liable
        for indirect or unforeseeable losses, or for what happens between job seekers and businesses,
        including hiring decisions and employment. If we are liable to a business for a job post, our
        liability is limited to the fee paid for that post. Nothing in these terms limits liability
        that can&apos;t legally be limited, such as for death or personal injury caused by
        negligence, or for fraud, and nothing affects your statutory rights as a consumer.
      </p>

      <h2>Governing law</h2>
      <p>
        These terms are governed by the law of England and Wales. If you live elsewhere, you keep
        the protections of your local consumer law.
      </p>

      <h2>Changes and contact</h2>
      <p>
        We may update these terms and will update the date at the top. If a change is significant, we
        will tell you before it takes effect. Questions: <MailLink />.
      </p>
      <LegalMeta>
        <LegalLink href="/privacy">Privacy policy</LegalLink>
      </LegalMeta>
    </LegalDocument>
  );
}
