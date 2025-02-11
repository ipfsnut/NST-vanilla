class StateValidator {
    constructor(validStates, validTransitions) {
        this.validStates = validStates;
        this.validTransitions = validTransitions;
    }

    validateTransition(fromState, toState, context = {}) {
        // Validate state existence
        if (!this.validStates.includes(fromState)) {
            throw new Error(`Invalid source state: ${fromState}`);
        }
        if (!this.validStates.includes(toState)) {
            throw new Error(`Invalid target state: ${toState}`);
        }

        // Validate transition allowance
        const allowedTransitions = this.validTransitions[fromState] || [];
        if (!allowedTransitions.includes(toState)) {
            throw new Error(`Invalid transition from ${fromState} to ${toState}`);
        }

        // Validate break state requirements
        if (this.isBreakState(toState)) {
            if (!context.breakDuration) {
                throw new Error(`Break duration required for transition to ${toState}`);
            }
        }

        return true;
    }

    isBreakState(state) {
        return state === 'DIGIT_BREAK' || state === 'TRIAL_BREAK';
    }

    getValidNextStates(currentState) {
        return this.validTransitions[currentState] || [];
    }
}
