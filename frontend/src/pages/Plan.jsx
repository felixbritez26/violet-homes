import { useState } from "react";
import { Check, Flag } from "lucide-react";
const steps = [
  "Set my target budget",
  "Choose my preferred neighborhoods",
  "Save a shortlist of homes",
  "Arrange property visits",
  "Review my next steps",
];
export default function Plan({ plan, setPlan }) {
  const [budget, setBudget] = useState(plan.budget || "");
  return (
    <>
      <div className="eyebrow">ONE STEP CLOSER</div>
      <h1>
        Your home.
        <br />
        <span>Your game plan.</span>
      </h1>
      <p className="intro">A little clarity goes a long way.</p>
      <section className="feature">
        <Flag />
        <h2>Build your next chapter</h2>
        <p>Keep your priorities together as you explore your options.</p>
        <label>
          My target budget
          <input
            type="number"
            min="1"
            placeholder="450000"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
          />
        </label>
        <button
          className="primary"
          onClick={() => setPlan({ ...plan, budget })}
        >
          Save budget
        </button>
      </section>
      <h2>Your checklist</h2>
      <p className="muted">
        {(plan.done || []).length} of {steps.length} complete · saved on this
        device
      </p>
      <div className="checklist">
        {steps.map((step, i) => (
          <button
            key={step}
            className="check-row"
            onClick={() =>
              setPlan({
                ...plan,
                done: (plan.done || []).includes(i)
                  ? plan.done.filter((x) => x !== i)
                  : [...(plan.done || []), i],
              })
            }
          >
            <span className={(plan.done || []).includes(i) ? "checked" : ""}>
              {(plan.done || []).includes(i) && <Check size={16} />}
            </span>
            {step}
          </button>
        ))}
      </div>
    </>
  );
}
