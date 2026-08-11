// https://www.sajid.bd
// ============================================================================
// TESTBENCH FOR THE SINGLE-CYCLE ARM PROCESSOR SIMULATION
// ============================================================================
// This SystemVerilog file is intended for simulating and teaching the rewritten
// single-cycle ARM processor used in the workshop.
//
// The testbench performs four jobs:
//   1. generate the processor clock;
//   2. apply and release reset;
//   3. generate a VCD waveform file for GTKWave; and
//   4. observe the workshop success signature written to data memory.
//
// Optional command-line control:
//   vvp arm_single.out +CYCLES=40
//
// If +CYCLES is omitted, the testbench runs for DEFAULT_CYCLES active cycles.
// ============================================================================

// Define simulation time units so all delays below are interpreted in nanoseconds.
`timescale 1ns/1ps

// This module is the top-level simulation testbench and therefore has no external ports.
module testbench;

    // This parameter provides the default number of post-reset processor cycles to execute.
    parameter integer DEFAULT_CYCLES = 25;
    // This local parameter gives a 10 ns clock period by toggling every 5 ns.
    localparam integer HALF_CLOCK_PERIOD_NS = 5;
    // This local parameter preserves a short reset interval that spans more than two rising clock edges.
    localparam integer RESET_DURATION_NS = 22;
    // This constant is the byte address corresponding to data-memory word 62.
    localparam logic [31:0] SUCCESS_ADDRESS = 32'd248;
    // This constant is the data value expected from the supplied workshop program at the success address.
    localparam logic [31:0] SUCCESS_VALUE = 32'd7;

    // This signal drives the processor-system clock input.
    logic        clk;
    // This signal drives the processor-system reset input.
    logic        reset;
    // This signal observes the processor value presented to data memory during stores.
    logic [31:0] WriteData;
    // This signal observes the processor-generated data-memory byte address.
    logic [31:0] DataAdr;
    // This signal observes whether the processor is requesting a valid data-memory write.
    logic        MemWrite;

    // This integer contains the selected cycle limit after processing the optional +CYCLES argument.
    integer requested_cycles;
    // This integer counts rising clock edges that occur after reset has been released.
    integer active_cycle_count;
    // This flag remembers whether the expected workshop success store has occurred at least once.
    logic   success_observed;

    // Instantiate the rewritten processor system exactly as workshop users will compile it.
    top dut (
        // Connect the generated simulation clock.
        .clk       (clk),
        // Connect the generated simulation reset.
        .reset     (reset),
        // Observe the processor's data-memory write payload.
        .WriteData (WriteData),
        // Observe the processor's data-memory byte address.
        .DataAdr   (DataAdr),
        // Observe the processor's condition-qualified memory-write control.
        .MemWrite  (MemWrite)
    // Complete the processor-system instance connection list.
    );

    // This initialization block selects the requested simulation length.
    initial begin
        // Begin with the documented default cycle count.
        requested_cycles = DEFAULT_CYCLES;
        // Attempt to replace the default using a decimal +CYCLES command-line plusarg.
        if ($value$plusargs("CYCLES=%d", requested_cycles)) begin
            // Report the user-selected active-cycle limit for reproducible workshop output.
            $display("[TB] Requested simulation length: %0d active cycle(s).", requested_cycles);
        // If no command-line plusarg was present, retain and report the default.
        end else begin
            // Inform the user that the parameter default will control the run length.
            $display("[TB] No +CYCLES argument supplied; using %0d active cycle(s).", requested_cycles);
        // Finish command-line argument handling.
        end

        // Reject zero or negative run lengths because they cannot represent a useful processor simulation.
        if (requested_cycles <= 0) begin
            // Print a clear diagnostic rather than silently terminating.
            $display("[TB] ERROR: +CYCLES must be a positive integer.");
            // End the simulation immediately after reporting the invalid argument.
            $finish;
        // Finish validation of the requested cycle count.
        end
    // Finish simulation-length initialization.
    end

    // This initialization block starts the free-running processor clock.
    initial begin
        // Establish a known low clock level at time zero.
        clk = 1'b0;
        // Continue toggling until another testbench block ends the simulation.
        forever begin
            // Wait for half of the defined 10 ns clock period.
            #HALF_CLOCK_PERIOD_NS;
            // Invert the clock to create the next rising or falling edge.
            clk = ~clk;
        // Finish one clock half-cycle and repeat forever.
        end
    // Finish clock-generator initialization.
    end

    // This initialization block applies the processor reset at the beginning of simulation.
    initial begin
        // Assert reset before the first active clock edge so PC and flags begin in a known state.
        reset = 1'b1;
        // Keep reset asserted long enough to cover more than two complete rising-edge opportunities.
        #RESET_DURATION_NS;
        // Release reset so the next clock edge begins normal instruction execution.
        reset = 1'b0;
        // Report reset release to make console traces easier to correlate with waveforms.
        $display("[TB] Reset released at simulation time %0t.", $time);
    // Finish reset generation.
    end

    // This initialization block configures waveform capture for GTKWave or another VCD viewer.
    initial begin
        // Name the waveform output file produced by the simulator.
        $dumpfile("arm_single.vcd");
        // Record the full testbench hierarchy, including the CPU and memories beneath dut.
        $dumpvars(0, testbench);
    // Finish VCD waveform setup.
    end

    // This initialization block establishes known values for testbench bookkeeping variables.
    initial begin
        // No active processor cycles have occurred at simulation time zero.
        active_cycle_count = 0;
        // The expected success memory transaction has not yet been observed.
        success_observed = 1'b0;
    // Finish testbench bookkeeping initialization.
    end

    // This block counts processor cycles only after reset is deasserted.
    always @(posedge clk) begin
        // Ignore clock edges while reset is active because the processor is not executing instructions normally.
        if (!reset) begin
            // Increment the active-cycle count using a blocking assignment for straightforward testbench bookkeeping.
            active_cycle_count = active_cycle_count + 1;
        // Finish the post-reset cycle-count update.
        end
    // Finish active-cycle counting.
    end

    // This block samples store transactions on falling edges, away from rising-edge state updates.
    always @(negedge clk) begin
        // Examine a transaction only when reset is inactive and the processor asserts memory write.
        if (!reset && MemWrite) begin
            // Report every committed store so students can correlate architectural behavior with the waveform.
            $display("[TB] Cycle %0d STORE address=0x%08h data=0x%08h", active_cycle_count, DataAdr, WriteData);

            // Compare the transaction against the workshop program's expected success signature.
            if ((DataAdr === SUCCESS_ADDRESS) && (WriteData === SUCCESS_VALUE)) begin
                // Avoid repeating the success announcement if software writes the signature more than once.
                if (!success_observed) begin
                    // Report the first cycle at which the expected result becomes visible at data memory.
                    $display("[TB] SUCCESS signature observed at active cycle %0d.", active_cycle_count);
                // Finish one-time success reporting.
                end
                // Remember the successful transaction for the final end-of-run summary.
                success_observed = 1'b1;
            // Finish success-signature comparison.
            end
        // Finish optional store-transaction observation.
        end

        // Stop after the requested number of complete post-reset processor cycles has been observed.
        if (!reset && (active_cycle_count >= requested_cycles)) begin
            // Choose the final message according to whether the expected transaction occurred.
            if (success_observed) begin
                // Report a successful bounded simulation run.
                $display("[TB] Completed %0d active cycle(s); success condition was observed.", active_cycle_count);
            // Handle the case where the cycle limit is reached without the expected store.
            end else begin
                // Report that execution completed but the expected program signature was not seen.
                $display("[TB] Completed %0d active cycle(s); success condition was NOT observed.", active_cycle_count);
            // Finish final pass/fail-style reporting.
            end
            // Terminate simulation cleanly after producing the final summary.
            $finish;
        // Finish cycle-limit handling.
        end
    // Finish falling-edge transaction monitoring and simulation termination.
    end

// End of the workshop processor testbench.
endmodule
