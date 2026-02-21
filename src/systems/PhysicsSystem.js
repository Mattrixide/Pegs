const GRAVITY = 0.28;
const MAX_BALL_FRAMES = 1800; // 30 seconds safety kill

export class PhysicsSystem {
  /**
   * Advance ball physics one frame.
   * Returns: 'exited' | { hitPegs: Peg[] } | null
   */
  update(ball, pegs, canvas) {
    if (!ball || !ball.active) return null;

    // Safety: kill stuck balls
    if (ball.frameCount > MAX_BALL_FRAMES) return 'exited';

    // Snapshot position before this step so the renderer can interpolate
    ball.prevPos.x = ball.pos.x;
    ball.prevPos.y = ball.pos.y;

    // Gravity
    ball.vel.y += GRAVITY;

    // Move
    ball.pos.x += ball.vel.x;
    ball.pos.y += ball.vel.y;
    ball.update(); // record trail + increment frameCount

    // Wall collisions
    if (ball.pos.x - ball.radius < 0) {
      ball.pos.x = ball.radius;
      ball.vel.x = Math.abs(ball.vel.x);
    } else if (ball.pos.x + ball.radius > canvas.width) {
      ball.pos.x = canvas.width - ball.radius;
      ball.vel.x = -Math.abs(ball.vel.x);
    }

    // Ceiling (shouldn't happen but just in case)
    if (ball.pos.y - ball.radius < 50) {
      ball.pos.y = 50 + ball.radius;
      ball.vel.y = Math.abs(ball.vel.y);
    }

    // Exit bottom
    if (ball.pos.y - ball.radius > canvas.height) return 'exited';

    // Peg collisions
    const hitPegs = [];
    for (const peg of pegs) {
      if (peg.removed || peg.removing || peg.hitCooldown > 0) {
        if (peg.hitCooldown > 0) peg.hitCooldown--;
        continue;
      }

      const dx = ball.pos.x - peg.pos.x;
      const dy = ball.pos.y - peg.pos.y;
      const distSq = dx * dx + dy * dy;
      const minDist = ball.radius + peg.radius;

      if (distSq < minDist * minDist) {
        const dist = Math.sqrt(distSq);
        const nx = dx / dist;
        const ny = dy / dist;

        // Reflect velocity around normal
        const dot = ball.vel.x * nx + ball.vel.y * ny;
        ball.vel.x -= 2 * dot * nx;
        ball.vel.y -= 2 * dot * ny;

        // Slight energy loss
        ball.vel.x *= 0.97;
        ball.vel.y *= 0.97;

        // Separate ball from peg surface
        const overlap = minDist - dist + 0.5;
        ball.pos.x += nx * overlap;
        ball.pos.y += ny * overlap;

        // Prevent same peg being hit again immediately
        peg.hitCooldown = 8;

        if (!peg.lit) {
          peg.lit = true;
          hitPegs.push(peg);
        }
      }
    }

    // Enforce minimum downward drift so ball always exits eventually
    if (ball.vel.y < -2 && ball.speed < 3) {
      ball.vel.y += 1;
    }

    return hitPegs.length > 0 ? { hitPegs } : null;
  }

  /**
   * Simulate trajectory for the aim guide.
   * Returns array of {x,y} sample points.
   *
   * This is a direct 1:1 clone of update() so the preview path matches
   * the real ball exactly. Peg cooldowns are snapshotted so real peg
   * objects are never mutated.
   */
  simulateTrajectory(startX, startY, vx, vy, canvas, steps = 110, extended = false, pegs = null) {
    const points   = [];
    const hitPegs  = []; // pegs the beam will hit — for glow highlighting
    let x = startX, y = startY;
    let dvx = vx, dvy = vy;
    const r = 8;
    let wallBounces = 0;
    const maxBounces = 1;
    const maxPegHits = extended ? 5 : 0;
    let pegHitCount = 0;
    let belowCeiling = y - r >= 50; // don't clamp ceiling until ball descends past it

    // Snapshot real peg cooldowns — never touch actual peg objects
    const pegCooldowns = pegs ? pegs.map(p => p.hitCooldown) : null;

    points.push({ x, y }); // start at barrel tip

    for (let i = 0; i < steps; i++) {
      // ── Mirrors PhysicsSystem.update() exactly ──────────────────────────

      dvy += GRAVITY;
      x   += dvx;
      y   += dvy;

      // Walls
      if (x - r < 0) {
        x = r;               dvx =  Math.abs(dvx); wallBounces++;
      } else if (x + r > canvas.width) {
        x = canvas.width - r; dvx = -Math.abs(dvx); wallBounces++;
      }

      // Ceiling — only enforce after ball has descended into the play area
      if (!belowCeiling && y - r >= 50) belowCeiling = true;
      if (belowCeiling && y - r < 50) {
        y = 50 + r;
        dvy = Math.abs(dvy);
      }

      // Exit
      if (y - r > canvas.height) break;
      if (wallBounces > maxBounces)  break;

      // Peg collisions — same loop structure as update(), all pegs per frame
      if (pegs && pegCooldowns) {
        for (let pi = 0; pi < pegs.length; pi++) {
          const peg = pegs[pi];
          if (peg.removed || peg.removing || pegCooldowns[pi] > 0) {
            if (pegCooldowns[pi] > 0) pegCooldowns[pi]--;
            continue;
          }

          const dx     = x - peg.pos.x;
          const dy     = y - peg.pos.y;
          const distSq = dx * dx + dy * dy;
          const minDist = r + peg.radius;

          if (distSq < minDist * minDist) {
            const dist = Math.sqrt(distSq) || 1;
            const nx = dx / dist;
            const ny = dy / dist;

            // Contact point so the beam visually reaches the peg surface
            points.push({ x: peg.pos.x + nx * minDist, y: peg.pos.y + ny * minDist });
            // Record peg for glow highlight
            hitPegs.push(peg);

            const dot = dvx * nx + dvy * ny;
            dvx -= 2 * dot * nx;
            dvy -= 2 * dot * ny;
            dvx *= 0.97;
            dvy *= 0.97;

            const overlap = minDist - dist + 0.5;
            x += nx * overlap;
            y += ny * overlap;

            pegCooldowns[pi] = 8;
            pegHitCount++;
            if (pegHitCount >= maxPegHits) { y = canvas.height + 1; }
          }
        }
        if (y > canvas.height) break;
      }

      // Minimum downward drift (matches real physics)
      if (dvy < -2 && Math.sqrt(dvx * dvx + dvy * dvy) < 3) {
        dvy += 1;
      }

      points.push({ x, y });
    }
    return { points, hitPegs };
  }
}
