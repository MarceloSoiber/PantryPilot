import { ChangeDetectionStrategy, Component, resource } from '@angular/core';
import type { HealthResponse } from '@pantry-pilot/contracts';

@Component({
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected readonly health = resource<HealthResponse, undefined>({
    loader: async ({ abortSignal }) => {
      const response = await fetch('/api/health', { signal: abortSignal });
      const payload = (await response.json()) as HealthResponse;

      if (!response.ok && payload.status !== 'degraded') {
        throw new Error('Não foi possível consultar a API.');
      }

      return payload;
    },
  });

  protected reloadHealth(): void {
    this.health.reload();
  }
}
