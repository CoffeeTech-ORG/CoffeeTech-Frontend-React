import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FarmSections } from './FarmSections';
import { SectionCardsSkeleton } from '../../ui/Skeletons';
import { NotFound } from '../../AppShell/NotFound';
import { useFarms, Farm, Section } from '../../../hooks/useFarms';

/**
 * Resolves the farm from the URL's `:farmId` and hands it to `FarmSections`. The view rebuilds from
 * the address rather than from memory, so a direct link or an F5 has somewhere to get the farm from
 * instead of dropping to the start.
 */
export const FarmSectionsView: React.FC = () => {
  const { farmId } = useParams<{ farmId: string }>();
  const navigate = useNavigate();
  const { getFarms } = useFarms();
  const [farm, setFarm] = useState<Farm | null>(null);
  const [loading, setLoading] = useState(true);

  const [recarga, setRecarga] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getFarms()
      .then((farms) => {
        if (!cancelled) setFarm(farms.find((f) => f.id === farmId) ?? null);
      })
      .catch(() => {
        if (!cancelled) setFarm(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [farmId, getFarms, recarga]);

  // Skeleton, not a spinner: the view behind also loads with a skeleton, and chaining two waiting
  // languages for one navigation reads as two loads in a row.
  if (loading) return <SectionCardsSkeleton count={2} />;

  if (!farm) return <NotFound kind="farm" />;

  return (
    <FarmSections
      farm={farm}
      onBack={() => navigate('/dashboard')}
      onSectionSelect={(section: Section) =>
        navigate(`/fincas/${farm.id}/secciones/${section.id}`)
      }
      onFarmChanged={() => setRecarga((n) => n + 1)}
      onFarmDeleted={() => navigate('/dashboard')}
    />
  );
};
