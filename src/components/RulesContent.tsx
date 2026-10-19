import { useT } from '../i18n';

// Rules text: the "Rules" tab of the How to play window (HowToPlayPopover).
export function RulesContent() {
  const t = useT();

  return (
    <div className="rules-body">
      <section>
        <h3>{t.rules.goalH}</h3>
        <p>{t.rules.goalP}</p>
      </section>

      <section>
        <h3>{t.rules.turnH}</h3>
        <p>{t.rules.turnP}</p>
        <ol className="rules-steps">
          <li>{t.rules.turnTapEmpty}</li>
          <li>{t.rules.turnTapClaim}</li>
        </ol>
      </section>

      <section>
        <h3>{t.rules.scoringH}</h3>
        <p>{t.rules.scoringP}</p>
        <ul className="rules-bullets">
          <li>{t.rules.score3}</li>
          <li>{t.rules.score5}</li>
          <li>{t.rules.score8}</li>
          <li>{t.rules.scoreCorner}</li>
        </ul>
      </section>

      <section className="rules-highlight">
        <h3>{t.rules.catchH}</h3>
        <p>{t.rules.catchP}</p>
      </section>

      <section>
        <h3>{t.rules.watchH}</h3>
        <p>{t.rules.watchP}</p>
      </section>

      <section>
        <h3>{t.rules.endH}</h3>
        <p>{t.rules.endP}</p>
      </section>

      <section>
        <h3>{t.rules.tipsH}</h3>
        <ul className="rules-bullets">
          <li>{t.rules.tip1}</li>
          <li>{t.rules.tip2}</li>
          <li>{t.rules.tip3}</li>
          <li>{t.rules.tip4}</li>
        </ul>
      </section>

      <section>
        <h3>{t.rules.modesH}</h3>
        <ul className="rules-bullets">
          <li><strong>{t.rules.modeBotsLead}</strong> {t.rules.modeBots}</li>
          <li><strong>{t.rules.modeHotseatLead}</strong> {t.rules.modeHotseat}</li>
          <li><strong>{t.rules.modeMpLead}</strong> {t.rules.modeMp}</li>
        </ul>
      </section>
    </div>
  );
}
