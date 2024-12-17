const StateManager = require('../services/stateManager');

describe('StateManager', () => {
  let stateManager;
  const experimentId = 'test-123';
  
    beforeEach(() => {
      stateManager = new StateManager();
    });
  
    test('creates new session', async () => {
      const session = await stateManager.createSession(experimentId, {});
      expect(session.experimentId).toBe(experimentId);
      expect(session.phase).toBe('init');
    });
  
    test('gets experiment state', async () => {
      await stateManager.createSession(experimentId, {});
      const state = await stateManager.getExperimentState(experimentId);
      expect(state.experimentId).toBe(experimentId);
    });
  
    test('updates state correctly', async () => {
      await stateManager.createSession(experimentId, {});
      const updated = await stateManager.updateState(experimentId, {
        phase: 'running',
        currentTrial: 1
      });
      expect(updated.phase).toBe('running');
      expect(updated.currentTrial).toBe(1);
    });
  
    test('throws error for invalid phase', async () => {
      await stateManager.createSession(experimentId, {});
      await expect(
        stateManager.updateState(experimentId, { phase: 'invalid' })
      ).rejects.toThrow('Invalid phase transition');
    });

    test('handles state transitions correctly', async () => {
        const session = await stateManager.createSession(experimentId, {});
        
        // Test init -> running
        let updated = await stateManager.updateState(experimentId, { phase: 'running' });
        expect(updated.phase).toBe('running');
        
        // Test running -> paused
        updated = await stateManager.updateState(experimentId, { phase: 'paused' });
        expect(updated.phase).toBe('paused');
      });

      test('throws error for non-existent session', async () => {
        await expect(
          stateManager.getExperimentState('fake-id')
        ).rejects.toThrow('Session not found');
      });
    
      test('handles concurrent state updates', async () => {
        await stateManager.createSession(experimentId, {});
        const updates = await Promise.all([
          stateManager.updateState(experimentId, { currentTrial: 1 }),
          stateManager.updateState(experimentId, { currentDigit: 2 })
        ]);
        expect(updates[1].currentTrial).toBe(1);
        expect(updates[1].currentDigit).toBe(2);
      });
    
    
      test('tracks trial progression', async () => {
        await stateManager.createSession(experimentId, {});
        const updated = await stateManager.updateState(experimentId, {
          currentTrial: 1,
          currentDigit: 2,
          responses: ['odd']
        });
        
        expect(updated.currentTrial).toBe(1);
        expect(updated.currentDigit).toBe(2);
        expect(updated.responses).toHaveLength(1);
      });
  });
  