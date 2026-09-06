import { Card, SectionTitle } from "../components/ui/primitives.jsx";
import RiotImportSection from "../components/settings/RiotImportSection.jsx";
import GameRecapCard from "../components/GameRecapCard.jsx";

export default function AddGame({ data, sorted, setSettings, importGames, importRiotResult }) {
  return (
    <div style={{ maxWidth: 820 }}>
      <SectionTitle sub="Récupère tes dernières games SoloQ automatiquement depuis l'API Riot — plus besoin de tout ressaisir à la main.">
        Ajouter une game
      </SectionTitle>

      <Card className="p-6">
        <RiotImportSection
          data={data}
          setSettings={setSettings}
          importGames={importGames}
          importRiotResult={importRiotResult}
        />
      </Card>

      <GameRecapCard data={data} sorted={sorted} />
    </div>
  );
}
