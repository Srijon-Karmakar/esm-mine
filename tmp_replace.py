
from pathlib import Path
path = Path(" apps/frontend/src/pages/dashboard/sections/MatchesPage.tsx\)
data = path.read_text()
data = data.replace('import { useMemo, useState } from  react;', 'import { useCallback, useMemo, useState } from react;', 1)
path.write_text(data)
