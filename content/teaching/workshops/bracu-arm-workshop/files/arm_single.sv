// https://www.sajid.bd
// ============================================================================
//  SINGLE-CYCLE ARM PROCESSOR SIMULATION MODEL
// ============================================================================
// This SystemVerilog file is intended for simulating and teaching a small
// single-cycle ARM processor in a workshop/laboratory environment.
//
// The implementation below is a newly written educational re-expression of
// the functional behavior of the processor model supplied for this workshop.
// It deliberately uses explicit control signals, descriptive identifiers, and
// expanded instructional comments so students can follow the datapath and
// control flow without relying on a compact encoded control table.
//
// Implemented instruction subset:
//   * Data processing: ADD, SUB, AND, ORR
//   * Memory transfer: LDR, STR
//   * Control flow:    B
//   * ARM condition-field evaluation for conditional instruction execution
//
// Simulation memory model:
//   * 64 words of instruction memory
//   * 64 words of data memory
//   * Instruction memory is initialized from "memfile.dat"
//
// External workshop interface is intentionally kept simple:
//   clk, reset -> processor system inputs
//   WriteData, DataAdr, MemWrite -> visible data-memory transaction signals
// ============================================================================

// This module forms the simulation wrapper around the CPU and both memories.
module top(
    // The clock advances the processor and commits synchronous writes.
    input  logic        clk,
    // An asserted reset returns the processor program counter and flags to zero.
    input  logic        reset,
    // This output exposes the value presented to data memory during a store.
    output logic [31:0] WriteData,
    // This output exposes the byte address produced by the CPU ALU.
    output logic [31:0] DataAdr,
    // This output is asserted when the current instruction performs a valid store.
    output logic        MemWrite
    // Complete the top-level module port declaration.
);

    // This signal carries the byte address of the instruction currently being fetched.
    logic [31:0] PC;
    // This signal carries the 32-bit instruction read from instruction memory.
    logic [31:0] Instr;
    // This signal carries data returned by data memory during a load.
    logic [31:0] ReadData;

    // This instance executes one ARM-subset instruction per clock cycle.
    arm processor (
        // Connect the system clock to the CPU.
        .clk          (clk),
        // Connect the system reset to the CPU.
        .reset        (reset),
        // Send the CPU fetch address to instruction memory.
        .pc           (PC),
        // Return the fetched instruction to the CPU.
        .instruction  (Instr),
        // Expose the condition-qualified store-enable signal.
        .mem_write    (MemWrite),
        // Expose the ALU-generated data-memory byte address.
        .data_address (DataAdr),
        // Expose the register value that a store writes to memory.
        .write_data   (WriteData),
        // Return data-memory read data to the CPU for LDR instructions.
        .read_data    (ReadData)
        // Complete the CPU instance connection list.
    );

    // This instance supplies instructions from the workshop program image.
    imem instruction_store (
        // Use the CPU program counter as the instruction byte address.
        .address (PC),
        // Return the selected instruction word.
        .data    (Instr)
        // Complete the instruction-memory instance connection list.
    );

    // This instance models a small synchronous-write, asynchronous-read data memory.
    dmem data_store (
        // Data-memory writes occur on the rising clock edge.
        .clk        (clk),
        // Only condition-approved STR instructions assert this write enable.
        .write_en   (MemWrite),
        // The ALU result acts as the byte address for load/store operations.
        .address    (DataAdr),
        // Store data comes from the processor's second register read port.
        .write_data (WriteData),
        // Load data is returned combinationally to the processor.
        .read_data  (ReadData)
        // Complete the data-memory instance connection list.
    );

// End of the complete processor-and-memory simulation wrapper.
endmodule


// This module models the 64-word data memory used by the single-cycle processor.
module dmem(
    // The rising edge is used to commit store operations.
    input  logic        clk,
    // A high write enable causes one addressed word to be updated.
    input  logic        write_en,
    // The processor supplies a byte address; only word-aligned bits select RAM entries.
    input  logic [31:0] address,
    // This is the 32-bit value written by an STR instruction.
    input  logic [31:0] write_data,
    // This is the asynchronously read 32-bit word used by an LDR instruction.
    output logic [31:0] read_data
    // Complete the data-memory module port declaration.
);

    // The workshop data memory contains 64 independently addressable 32-bit words.
    logic [31:0] words [0:63];

    // Convert the byte address into a six-bit word index for the 64-word memory.
    wire [5:0] word_index = address[7:2];

    // Continuously present the selected memory word at the read-data output.
    assign read_data = words[word_index];

    // This sequential block implements the memory write port.
    always_ff @(posedge clk) begin
        // A store modifies memory only when the condition-qualified write signal is high.
        if (write_en) begin
            // Commit the complete 32-bit store value into the selected word location.
            words[word_index] <= write_data;
        // Finish the conditional memory-write operation.
        end
    // Finish the rising-edge memory behavior.
    end

// End of the data-memory model.
endmodule


// This module models the 64-word instruction memory used by the processor.
module imem(
    // The processor supplies a byte-addressed program counter.
    input  logic [31:0] address,
    // The selected 32-bit machine instruction is returned combinationally.
    output logic [31:0] data
    // Complete the instruction-memory module port declaration.
);

    // The workshop instruction store contains 64 words of 32-bit ARM machine code.
    logic [31:0] words [0:63];

    // Load the hexadecimal workshop program before processor simulation begins.
    initial begin
        // Read one hexadecimal machine-code word per entry from the external data file.
        $readmemh("memfile.dat", words);
    // Finish instruction-memory initialization.
    end

    // Convert the byte address into a six-bit word index for the 64-word program memory.
    wire [5:0] word_index = address[7:2];

    // Continuously return the instruction selected by the current program counter.
    assign data = words[word_index];

// End of the instruction-memory model.
endmodule


// This module contains the complete single-cycle ARM-subset processor core.
module arm(
    // The clock commits the program counter, flags, and register-file writes.
    input  logic        clk,
    // Reset clears the program counter and saved condition flags.
    input  logic        reset,
    // The current byte-addressed program counter is exported to instruction memory.
    output logic [31:0] pc,
    // The currently fetched 32-bit instruction enters from instruction memory.
    input  logic [31:0] instruction,
    // This output requests a data-memory write for a condition-approved STR.
    output logic        mem_write,
    // The ALU result is exported as the data-memory byte address.
    output logic [31:0] data_address,
    // This output carries the source-register value for a store.
    output logic [31:0] write_data,
    // This input carries data returned by memory for an LDR.
    input  logic [31:0] read_data
    // Complete the processor-core module port declaration.
);

    // These two bits select which instruction fields drive the two register read addresses.
    logic [1:0] register_source_select;
    // These two bits select the immediate-extension format for the current instruction class.
    logic [1:0] immediate_format;
    // This signal selects immediate data instead of register data for ALU operand B.
    logic       alu_uses_immediate;
    // These two bits select ADD, SUB, AND, or ORR in the ALU.
    logic [1:0] alu_operation;
    // This signal selects memory data rather than the ALU result for register write-back.
    logic       writeback_from_memory;
    // This raw signal indicates that the decoded instruction intends to write a register.
    logic       decoded_register_write;
    // This raw signal indicates that the decoded instruction intends to write data memory.
    logic       decoded_memory_write;
    // This raw signal indicates that normal execution should replace PC+4 with Result.
    logic       decoded_pc_write;
    // This signal indicates that N and Z flags should be updated when the condition passes.
    logic       update_nz_flags;
    // This signal indicates that C and V flags should be updated when the condition passes.
    logic       update_cv_flags;
    // These four bits are the N, Z, C, and V values produced by the current ALU operation.
    logic [3:0] current_alu_flags;
    // This signal is the condition-qualified enable for register-file write-back.
    logic       register_write;
    // This signal is the condition-qualified request to replace the sequential PC.
    logic       pc_write;

    // This control block translates ARM instruction fields into explicit datapath controls.
    arm_control_unit control (
        // The clock is required because architectural flags are stored here.
        .clk                    (clk),
        // Reset clears all stored condition flags.
        .reset                  (reset),
        // The controller examines the entire instruction for class, opcode, destination, and condition.
        .instruction            (instruction),
        // The ALU supplies candidate N/Z/C/V values for flag-changing instructions.
        .alu_flags              (current_alu_flags),
        // These outputs choose the two register-file source-address fields.
        .register_source_select (register_source_select),
        // This output selects immediate expansion semantics.
        .immediate_format       (immediate_format),
        // This output chooses register or immediate ALU operand B.
        .alu_uses_immediate     (alu_uses_immediate),
        // This output selects the arithmetic/logic operation.
        .alu_operation          (alu_operation),
        // This output chooses memory or ALU data for register write-back.
        .writeback_from_memory  (writeback_from_memory),
        // This output is the final condition-qualified register-file write enable.
        .register_write         (register_write),
        // This output is the final condition-qualified data-memory write enable.
        .memory_write           (mem_write),
        // This output is the final condition-qualified program-counter redirection enable.
        .pc_write               (pc_write),
        // This diagnostic output exposes the decoded register-write intent before conditioning.
        .decoded_register_write (decoded_register_write),
        // This diagnostic output exposes the decoded memory-write intent before conditioning.
        .decoded_memory_write   (decoded_memory_write),
        // This diagnostic output exposes the decoded PC-write intent before conditioning.
        .decoded_pc_write       (decoded_pc_write),
        // This diagnostic output identifies instructions that may update N/Z.
        .update_nz_flags        (update_nz_flags),
        // This diagnostic output identifies arithmetic instructions that may update C/V.
        .update_cv_flags        (update_cv_flags)
        // Complete the control-unit instance connection list.
    );

    // This datapath block performs operand selection, execution, memory addressing, and write-back.
    arm_datapath datapath (
        // The clock commits the PC and register-file writes.
        .clk                    (clk),
        // Reset clears the program counter.
        .reset                  (reset),
        // The fetched machine instruction provides register and immediate fields.
        .instruction            (instruction),
        // The register-source selector chooses instruction fields or R15 for each read port.
        .register_source_select (register_source_select),
        // This enable controls whether a destination register is written this cycle.
        .register_write         (register_write),
        // This selector tells the immediate unit how to expand instruction bits.
        .immediate_format       (immediate_format),
        // This selector chooses immediate data as the second ALU operand when asserted.
        .alu_uses_immediate     (alu_uses_immediate),
        // This selector chooses the requested arithmetic or logical ALU operation.
        .alu_operation          (alu_operation),
        // This selector chooses memory read data for LDR write-back.
        .writeback_from_memory  (writeback_from_memory),
        // This enable selects the computed Result as the next PC rather than PC+4.
        .pc_write               (pc_write),
        // Data-memory read data is used only when an LDR reaches write-back.
        .read_data              (read_data),
        // Export the current program counter to instruction memory.
        .pc                     (pc),
        // Export the ALU result as the load/store address.
        .alu_result             (data_address),
        // Export register operand B as the data value for STR.
        .store_data             (write_data),
        // Export candidate N/Z/C/V flags to the control unit.
        .alu_flags              (current_alu_flags)
        // Complete the datapath instance connection list.
    );

// End of the single-cycle ARM processor core.
endmodule


// This module decodes instructions, stores flags, and applies ARM condition codes.
module arm_control_unit(
    // Architectural flag registers are updated on rising clock edges.
    input  logic        clk,
    // Reset clears the saved N, Z, C, and V flags.
    input  logic        reset,
    // The complete instruction provides condition, class, opcode, S bit, and destination fields.
    input  logic [31:0] instruction,
    // Candidate ALU flags arrive in the order N, Z, C, V.
    input  logic [3:0]  alu_flags,
    // These bits choose the two register-file read-address sources.
    output logic [1:0]  register_source_select,
    // These bits choose data-processing, memory-offset, or branch immediate expansion.
    output logic [1:0]  immediate_format,
    // This control chooses immediate data for the ALU's second input.
    output logic        alu_uses_immediate,
    // These bits select ADD, SUB, AND, or ORR in the ALU.
    output logic [1:0]  alu_operation,
    // This control selects memory data for register write-back.
    output logic        writeback_from_memory,
    // This is the condition-qualified register-file write enable.
    output logic        register_write,
    // This is the condition-qualified data-memory write enable.
    output logic        memory_write,
    // This is the condition-qualified PC redirection enable.
    output logic        pc_write,
    // This exposes the raw decoded register-write request for instructional waveform viewing.
    output logic        decoded_register_write,
    // This exposes the raw decoded memory-write request for instructional waveform viewing.
    output logic        decoded_memory_write,
    // This exposes the raw decoded PC-write request for instructional waveform viewing.
    output logic        decoded_pc_write,
    // This indicates that a successful instruction condition permits N/Z updates.
    output logic        update_nz_flags,
    // This indicates that a successful arithmetic instruction condition permits C/V updates.
    output logic        update_cv_flags
    // Complete the control-unit module port declaration.
);

    // These bits identify the broad ARM instruction class from instruction bits 27:26.
    logic [1:0] instruction_class;
    // This bit distinguishes register and immediate data-processing forms.
    logic       immediate_bit;
    // These four bits identify the supported data-processing operation.
    logic [3:0] data_opcode;
    // This bit is the ARM S bit for data-processing instructions and L bit for memory transfers.
    logic       s_or_load_bit;
    // These four bits identify the destination register field.
    logic [3:0] destination_register;
    // These four bits hold the instruction's ARM condition code.
    logic [3:0] condition_code;
    // These bits store the processor's architectural N, Z, C, and V flags.
    logic [3:0] saved_flags;
    // This signal is true when the current condition field is satisfied by saved flags.
    logic       condition_passes;
    // This temporary decode bit requests N/Z updates before condition qualification.
    logic       decoded_update_nz;
    // This temporary decode bit requests C/V updates before condition qualification.
    logic       decoded_update_cv;
    // This temporary decode bit marks a branch instruction.
    logic       decoded_branch;

    // Name instruction subfields explicitly so the decode equations remain readable.
    assign instruction_class   = instruction[27:26];
    // Extract the data-processing immediate selector from bit 25.
    assign immediate_bit       = instruction[25];
    // Extract the data-processing opcode from bits 24:21.
    assign data_opcode         = instruction[24:21];
    // Extract the shared S/L control bit from bit 20.
    assign s_or_load_bit       = instruction[20];
    // Extract the destination-register field from bits 15:12.
    assign destination_register = instruction[15:12];
    // Extract the instruction condition code from bits 31:28.
    assign condition_code      = instruction[31:28];

    // This combinational block produces all raw control signals for the supported instruction subset.
    always_comb begin
        // By default, read Rn on register-file port A and Rm on register-file port B.
        register_source_select = 2'b00;
        // By default, use the 8-bit data-processing immediate format.
        immediate_format       = 2'b00;
        // By default, source ALU operand B from a register.
        alu_uses_immediate     = 1'b0;
        // By default, use ADD so unsupported classes do not infer latches.
        alu_operation          = 2'b00;
        // By default, write-back comes from the ALU rather than memory.
        writeback_from_memory  = 1'b0;
        // By default, do not write a destination register.
        decoded_register_write = 1'b0;
        // By default, do not write data memory.
        decoded_memory_write   = 1'b0;
        // By default, the instruction does not explicitly branch.
        decoded_branch         = 1'b0;
        // By default, do not request N/Z flag updates.
        decoded_update_nz      = 1'b0;
        // By default, do not request C/V flag updates.
        decoded_update_cv      = 1'b0;

        // Decode the major ARM instruction class.
        case (instruction_class)
            // Class 00 covers the supported data-processing instructions.
            2'b00: begin
                // Data-processing instructions always write a destination register in this workshop subset.
                decoded_register_write = 1'b1;
                // Select immediate operand B when ARM instruction bit I is set.
                alu_uses_immediate     = immediate_bit;
                // Data-processing immediates use the low eight instruction bits in this simplified model.
                immediate_format       = 2'b00;
                // The ARM S bit requests N/Z updates for a condition-approved instruction.
                decoded_update_nz      = s_or_load_bit;

                // Decode the supported four-bit ARM data-processing opcode.
                case (data_opcode)
                    // Opcode 0100 selects integer addition.
                    4'b0100: begin
                        // Tell the ALU to calculate operand A plus operand B.
                        alu_operation     = 2'b00;
                        // An ADD with S=1 also updates carry and signed overflow.
                        decoded_update_cv = s_or_load_bit;
                    // Finish ADD decoding.
                    end
                    // Opcode 0010 selects integer subtraction.
                    4'b0010: begin
                        // Tell the ALU to calculate operand A minus operand B.
                        alu_operation     = 2'b01;
                        // A SUB with S=1 also updates carry/borrow-state and signed overflow.
                        decoded_update_cv = s_or_load_bit;
                    // Finish SUB decoding.
                    end
                    // Opcode 0000 selects bitwise AND.
                    4'b0000: begin
                        // Tell the ALU to AND corresponding bits of both operands.
                        alu_operation     = 2'b10;
                        // This simplified teaching subset does not update C/V for logical operations.
                        decoded_update_cv = 1'b0;
                    // Finish AND decoding.
                    end
                    // Opcode 1100 selects bitwise ORR.
                    4'b1100: begin
                        // Tell the ALU to OR corresponding bits of both operands.
                        alu_operation     = 2'b11;
                        // This simplified teaching subset does not update C/V for logical operations.
                        decoded_update_cv = 1'b0;
                    // Finish ORR decoding.
                    end
                    // Any other data-processing opcode is outside this workshop processor subset.
                    default: begin
                        // Drive the ALU selector unknown so unsupported instructions are visible in simulation.
                        alu_operation          = 2'bxx;
                        // Prevent unsupported instructions from corrupting the register file.
                        decoded_register_write = 1'b0;
                        // Prevent unsupported instructions from changing N/Z flags.
                        decoded_update_nz      = 1'b0;
                        // Prevent unsupported instructions from changing C/V flags.
                        decoded_update_cv      = 1'b0;
                    // Finish unsupported data-processing handling.
                    end
                // Finish data-processing opcode decoding.
                endcase
            // Finish major class 00 decoding.
            end

            // Class 01 covers the supported immediate-offset LDR and STR instructions.
            2'b01: begin
                // Load/store address generation adds Rn to a 12-bit unsigned offset.
                alu_operation         = 2'b00;
                // Select the expanded immediate offset as ALU operand B.
                alu_uses_immediate    = 1'b1;
                // Select the 12-bit zero-extension format.
                immediate_format      = 2'b01;

                // ARM bit 20 distinguishes LDR (1) from STR (0).
                if (s_or_load_bit) begin
                    // LDR writes the memory value into the Rd destination register.
                    decoded_register_write = 1'b1;
                    // LDR selects data-memory read data at the write-back multiplexer.
                    writeback_from_memory  = 1'b1;
                // Handle the STR form when bit 20 is clear.
                end else begin
                    // STR needs Rd on the second register read port because Rd supplies store data.
                    register_source_select = 2'b10;
                    // STR commits a word to data memory when its condition passes.
                    decoded_memory_write   = 1'b1;
                // Finish load-versus-store selection.
                end
            // Finish major class 01 decoding.
            end

            // Class 10 is treated as the workshop branch instruction form.
            2'b10: begin
                // A branch computes the target by adding a shifted signed displacement to PC+8.
                alu_operation          = 2'b00;
                // The branch base must read architectural R15, represented by PC+8.
                register_source_select = 2'b01;
                // The branch displacement comes from an expanded immediate rather than a register.
                alu_uses_immediate     = 1'b1;
                // Select signed 24-bit branch displacement expansion followed by a two-bit shift.
                immediate_format       = 2'b10;
                // Request program-counter redirection after condition checking.
                decoded_branch         = 1'b1;
            // Finish major class 10 decoding.
            end

            // Class 11 is outside the deliberately small workshop instruction subset.
            default: begin
                // Leave all side-effect controls inactive for an unsupported instruction class.
                decoded_register_write = 1'b0;
                // Do not allow unsupported classes to modify data memory.
                decoded_memory_write   = 1'b0;
                // Do not allow unsupported classes to redirect the PC.
                decoded_branch         = 1'b0;
                // Do not allow unsupported classes to alter N/Z flags.
                decoded_update_nz      = 1'b0;
                // Do not allow unsupported classes to alter C/V flags.
                decoded_update_cv      = 1'b0;
            // Finish unsupported class handling.
            end
        // Finish major instruction-class decoding.
        endcase
    // Finish the complete combinational instruction decoder.
    end

    // The ARM architectural convention also redirects the PC when an instruction writes R15.
    assign decoded_pc_write = decoded_branch ||
    // Combine branch intent with writes to architectural register R15.
                              (decoded_register_write && (destination_register == 4'd15));

    // This module evaluates the four-bit ARM condition field against the saved N/Z/C/V state.
    arm_condition_check condition_logic (
        // Supply the instruction's condition code.
        .condition (condition_code),
        // Supply the currently stored architectural flags.
        .flags     (saved_flags),
        // Receive a Boolean indication of whether the instruction may commit side effects.
        .passes    (condition_passes)
        // Complete the condition-checker instance connection list.
    );

    // Qualify N/Z flag-writing intent with the ARM condition result.
    assign update_nz_flags = decoded_update_nz && condition_passes;
    // Qualify C/V flag-writing intent with the ARM condition result.
    assign update_cv_flags = decoded_update_cv && condition_passes;
    // Qualify register-file writes so failed conditions behave like no-operation instructions.
    assign register_write  = decoded_register_write && condition_passes;
    // Qualify data-memory writes so failed conditions cannot modify memory.
    assign memory_write    = decoded_memory_write && condition_passes;
    // Qualify PC redirection so failed conditional branches fall through normally.
    assign pc_write        = decoded_pc_write && condition_passes;

    // This sequential block stores the processor condition flags across instructions.
    always_ff @(posedge clk or posedge reset) begin
        // Reset establishes N=0, Z=0, C=0, and V=0.
        if (reset) begin
            // Clear all four architectural condition flags together.
            saved_flags <= 4'b0000;
        // When not resetting, update only the flag groups requested by the instruction.
        end else begin
            // N and Z are updated by supported S-suffixed data-processing instructions.
            if (update_nz_flags) begin
                // Copy the current ALU N and Z outputs into the architectural flag register.
                saved_flags[3:2] <= alu_flags[3:2];
            // Finish the optional N/Z update.
            end
            // C and V are updated only for supported S-suffixed arithmetic instructions.
            if (update_cv_flags) begin
                // Copy the current ALU carry and overflow outputs into the architectural flag register.
                saved_flags[1:0] <= alu_flags[1:0];
            // Finish the optional C/V update.
            end
        // Finish normal flag-register behavior.
        end
    // Finish the sequential architectural-flag block.
    end

// End of the instruction decoder, condition logic, and flag storage block.
endmodule


// This module evaluates the ARM condition field using saved N, Z, C, and V flags.
module arm_condition_check(
    // The four-bit condition code comes from instruction bits 31:28.
    input  logic [3:0] condition,
    // The flag vector is ordered N, Z, C, V from most to least significant bit.
    input  logic [3:0] flags,
    // This output is one when the instruction's condition is satisfied.
    output logic       passes
    // Complete the condition-checker module port declaration.
);

    // Give descriptive names to the four architectural flags.
    logic negative_flag;
    // This signal mirrors the stored Z flag.
    logic zero_flag;
    // This signal mirrors the stored C flag.
    logic carry_flag;
    // This signal mirrors the stored V flag.
    logic overflow_flag;
    // Signed greater-or-equal is true when N and V have the same value.
    logic signed_ge;

    // Split the compact flag vector into readable individual signals.
    assign negative_flag = flags[3];
    // Extract the zero condition flag.
    assign zero_flag     = flags[2];
    // Extract the carry condition flag.
    assign carry_flag    = flags[1];
    // Extract the signed-overflow condition flag.
    assign overflow_flag = flags[0];
    // ARM signed comparisons use equality of N and V for the GE relation.
    assign signed_ge     = (negative_flag == overflow_flag);

    // This combinational block implements the standard ARM condition-code truth table.
    always_comb begin
        // Select the required Boolean expression for the instruction condition field.
        case (condition)
            // EQ executes when the previous result was zero.
            4'b0000: passes = zero_flag;
            // NE executes when the previous result was nonzero.
            4'b0001: passes = !zero_flag;
            // CS/HS executes when carry is set.
            4'b0010: passes = carry_flag;
            // CC/LO executes when carry is clear.
            4'b0011: passes = !carry_flag;
            // MI executes when the previous result was negative.
            4'b0100: passes = negative_flag;
            // PL executes when the previous result was nonnegative.
            4'b0101: passes = !negative_flag;
            // VS executes when signed overflow is set.
            4'b0110: passes = overflow_flag;
            // VC executes when signed overflow is clear.
            4'b0111: passes = !overflow_flag;
            // HI executes for an unsigned higher-than relation: C=1 and Z=0.
            4'b1000: passes = carry_flag && !zero_flag;
            // LS executes for unsigned lower-or-same: C=0 or Z=1.
            4'b1001: passes = !carry_flag || zero_flag;
            // GE executes for signed greater-than-or-equal: N equals V.
            4'b1010: passes = signed_ge;
            // LT executes for signed less-than: N differs from V.
            4'b1011: passes = !signed_ge;
            // GT executes for signed greater-than: Z=0 and N equals V.
            4'b1100: passes = !zero_flag && signed_ge;
            // LE executes for signed less-than-or-equal: Z=1 or N differs from V.
            4'b1101: passes = zero_flag || !signed_ge;
            // AL always executes in the supported ARM encoding.
            4'b1110: passes = 1'b1;
            // The remaining condition encoding is treated as unsupported in this teaching core.
            default: passes = 1'b0;
        // Finish condition-code selection.
        endcase
    // Finish combinational condition evaluation.
    end

// End of ARM condition-code evaluation.
endmodule


// This module implements the single-cycle datapath: PC, register file, immediate unit, ALU, and write-back.
module arm_datapath(
    // The rising edge commits the next PC and register-file write-back.
    input  logic        clk,
    // Reset returns the program counter to address zero.
    input  logic        reset,
    // The fetched instruction provides register addresses and immediate fields.
    input  logic [31:0] instruction,
    // These bits choose which instruction fields feed the two register-file read ports.
    input  logic [1:0]  register_source_select,
    // This enable commits the write-back result to the selected destination register.
    input  logic        register_write,
    // These bits choose the immediate extension rule.
    input  logic [1:0]  immediate_format,
    // This control chooses extended immediate data instead of the second register value for the ALU.
    input  logic        alu_uses_immediate,
    // These bits select ADD, SUB, AND, or ORR.
    input  logic [1:0]  alu_operation,
    // This control selects memory read data rather than ALU data for register write-back.
    input  logic        writeback_from_memory,
    // This control selects the write-back Result as the next program counter.
    input  logic        pc_write,
    // This input supplies memory data for LDR.
    input  logic [31:0] read_data,
    // This output is the current byte-addressed program counter.
    output logic [31:0] pc,
    // This output is the current ALU result and therefore the load/store address.
    output logic [31:0] alu_result,
    // This output is the unmodified second register value used by STR.
    output logic [31:0] store_data,
    // This output reports candidate N, Z, C, and V flags from the ALU.
    output logic [3:0]  alu_flags
    // Complete the datapath module port declaration.
);

    // This signal is the ordinary sequential next address, PC + 4 bytes.
    logic [31:0] pc_plus_4;
    // ARM reads architectural register R15 as the current instruction address plus 8 bytes.
    logic [31:0] pc_plus_8;
    // This signal is the value that will be committed to the PC on the next rising edge.
    logic [31:0] next_pc;
    // This four-bit address selects register-file read port A.
    logic [3:0]  read_address_a;
    // This four-bit address selects register-file read port B.
    logic [3:0]  read_address_b;
    // This is the first 32-bit register operand supplied to the ALU.
    logic [31:0] register_operand_a;
    // This is the second 32-bit register value, also exported directly as STR data.
    logic [31:0] register_operand_b;
    // This is the 32-bit expanded immediate derived from the instruction.
    logic [31:0] expanded_immediate;
    // This is the value selected for the ALU's second input.
    logic [31:0] alu_operand_b;
    // This is the final value written to the destination register or redirected into PC.
    logic [31:0] writeback_result;

    // Every ARM instruction in this simplified core occupies one 32-bit word.
    assign pc_plus_4 = pc + 32'd4;
    // The classic ARM architectural view exposes R15 as PC+8 when read by an instruction.
    assign pc_plus_8 = pc + 32'd8;

    // Select register-file read address A from Rn or architectural R15.
    assign read_address_a = register_source_select[0] ? 4'd15 : instruction[19:16];
    // Select register-file read address B from Rm or Rd depending on load/store requirements.
    assign read_address_b = register_source_select[1] ? instruction[15:12] : instruction[3:0];

    // This register bank supplies two operands and accepts one synchronous write-back value.
    arm_register_file registers (
        // Register writes are committed on the rising clock edge.
        .clk             (clk),
        // The control unit permits writes only for condition-approved instructions.
        .write_enable    (register_write),
        // Read port A receives the selected four-bit register address.
        .read_address_a  (read_address_a),
        // Read port B receives the selected four-bit register address.
        .read_address_b  (read_address_b),
        // The instruction Rd field identifies the write-back destination.
        .write_address   (instruction[15:12]),
        // The write-back multiplexer supplies the value written into Rd.
        .write_data      (writeback_result),
        // Reads of architectural R15 return PC+8 instead of array storage.
        .r15_value       (pc_plus_8),
        // Read port A produces the first source operand.
        .read_data_a     (register_operand_a),
        // Read port B produces the second source operand or STR payload.
        .read_data_b     (register_operand_b)
        // Complete the register-file instance connection list.
    );

    // Preserve the second register value separately because STR must not use the ALU-immediate mux output.
    assign store_data = register_operand_b;

    // This block expands the instruction's immediate field according to the current instruction class.
    arm_immediate_expand immediate_unit (
        // Supply the low 24 instruction bits containing all supported immediate forms.
        .instruction_low24 (instruction[23:0]),
        // Supply the controller-selected expansion mode.
        .format            (immediate_format),
        // Receive the resulting 32-bit ALU operand or branch displacement.
        .expanded          (expanded_immediate)
        // Complete the immediate-expansion instance connection list.
    );

    // Select the ALU's second input from the register bank or immediate expansion unit.
    assign alu_operand_b = alu_uses_immediate ? expanded_immediate : register_operand_b;

    // This arithmetic/logic unit performs the operation selected by the decoder and generates candidate flags.
    arm_alu32 execution_unit (
        // Operand A comes from the first register-file read port.
        .operand_a (register_operand_a),
        // Operand B comes from either the second register port or immediate expansion.
        .operand_b (alu_operand_b),
        // The control unit selects the operation.
        .operation (alu_operation),
        // The 32-bit result drives addressing and normal register write-back.
        .result    (alu_result),
        // The ALU reports N, Z, C, and V for possible architectural flag updates.
        .flags     (alu_flags)
        // Complete the ALU instance connection list.
    );

    // LDR selects the data-memory value; all other supported register writes select the ALU result.
    assign writeback_result = writeback_from_memory ? read_data : alu_result;

    // A branch or write to R15 redirects execution to Result; otherwise execution advances by four bytes.
    assign next_pc = pc_write ? writeback_result : pc_plus_4;

    // This sequential block is the processor program-counter register.
    always_ff @(posedge clk or posedge reset) begin
        // Reset begins execution from byte address zero.
        if (reset) begin
            // Clear the program counter when reset is asserted.
            pc <= 32'd0;
        // During normal execution, commit the next-PC value selected above.
        end else begin
            // Advance sequentially or redirect according to the condition-qualified PC control.
            pc <= next_pc;
        // Finish normal PC update behavior.
        end
    // Finish the program-counter register block.
    end

// End of the single-cycle datapath.
endmodule


// This module implements registers R0 through R14; reads of R15 are supplied externally as PC+8.
module arm_register_file(
    // The clock commits destination-register writes.
    input  logic        clk,
    // A high write enable stores write_data into write_address on the rising edge.
    input  logic        write_enable,
    // This four-bit address selects the first source register.
    input  logic [3:0]  read_address_a,
    // This four-bit address selects the second source register.
    input  logic [3:0]  read_address_b,
    // This four-bit address identifies the destination register Rd.
    input  logic [3:0]  write_address,
    // This is the 32-bit result committed to the destination register.
    input  logic [31:0] write_data,
    // ARM's architectural R15 read value is supplied as PC+8 by the datapath.
    input  logic [31:0] r15_value,
    // This is the combinational value read from source port A.
    output logic [31:0] read_data_a,
    // This is the combinational value read from source port B.
    output logic [31:0] read_data_b
    // Complete the register-file module port declaration.
);

    // Physical storage is required only for R0 through R14 because R15 is the PC.
    logic [31:0] registers [0:14];

    // This sequential block implements the single register-file write port.
    always_ff @(posedge clk) begin
        // Commit a write only when the controller enables it and the destination is not architectural R15.
        if (write_enable && (write_address != 4'd15)) begin
            // Store the complete 32-bit write-back result into the selected general-purpose register.
            registers[write_address] <= write_data;
        // Finish the optional register write.
        end
    // Finish synchronous register-file write behavior.
    end

    // Read R15 as PC+8; otherwise read the selected general-purpose register directly.
    assign read_data_a = (read_address_a == 4'd15) ? r15_value : registers[read_address_a];
    // Apply the same architectural R15 behavior independently to the second read port.
    assign read_data_b = (read_address_b == 4'd15) ? r15_value : registers[read_address_b];

// End of the three-port register-file model.
endmodule


// This module expands the immediate forms used by the supported instruction subset.
module arm_immediate_expand(
    // The low 24 instruction bits contain the 8-bit, 12-bit, and 24-bit immediate fields used here.
    input  logic [23:0] instruction_low24,
    // The controller selects which immediate interpretation applies to the current instruction.
    input  logic [1:0]  format,
    // This output is the resulting 32-bit immediate value.
    output logic [31:0] expanded
    // Complete the immediate-expansion module port declaration.
);

    // This combinational block applies the requested zero/sign extension and branch shift.
    always_comb begin
        // Select one of the three immediate formats used by the workshop processor.
        case (format)
            // Data-processing immediate: zero-extend the low eight bits.
            2'b00: expanded = {24'd0, instruction_low24[7:0]};
            // Load/store offset: zero-extend the low twelve bits.
            2'b01: expanded = {20'd0, instruction_low24[11:0]};
            // Branch displacement: sign-extend 24 bits and multiply by four by appending two zeros.
            2'b10: expanded = {{6{instruction_low24[23]}}, instruction_low24[23:0], 2'b00};
            // Unsupported control encodings deliberately produce an unknown value for easy waveform diagnosis.
            default: expanded = 32'hxxxxxxxx;
        // Finish immediate-format selection.
        endcase
    // Finish combinational immediate expansion.
    end

// End of the immediate expansion unit.
endmodule


// This module performs 32-bit arithmetic/logic operations and generates ARM-style N/Z/C/V flags.
module arm_alu32(
    // This is the first 32-bit ALU operand.
    input  logic [31:0] operand_a,
    // This is the second 32-bit ALU operand.
    input  logic [31:0] operand_b,
    // Operation 00=ADD, 01=SUB, 10=AND, and 11=ORR.
    input  logic [1:0]  operation,
    // This is the 32-bit arithmetic or logical result.
    output logic [31:0] result,
    // This four-bit output reports N, Z, C, and V respectively.
    output logic [3:0]  flags
    // Complete the ALU module port declaration.
);

    // This 33-bit temporary preserves the carry-out of addition and subtraction.
    logic [32:0] arithmetic_sum;
    // This 32-bit temporary optionally complements operand B to implement subtraction by two's complement addition.
    logic [31:0] adjusted_operand_b;
    // This signal becomes one for subtraction so the adder includes the required +1 term.
    logic        subtract_operation;
    // This signal is the candidate negative flag.
    logic        negative_flag;
    // This signal is the candidate zero flag.
    logic        zero_flag;
    // This signal is the candidate carry flag.
    logic        carry_flag;
    // This signal is the candidate signed-overflow flag.
    logic        overflow_flag;

    // Operation bit zero distinguishes subtraction from addition within the arithmetic operation group.
    assign subtract_operation = (operation == 2'b01);
    // Complement operand B only when subtraction is selected.
    assign adjusted_operand_b = subtract_operation ? ~operand_b : operand_b;
    // Perform A+B for ADD or A+(~B)+1 for SUB in one shared 33-bit adder.
    assign arithmetic_sum = {1'b0, operand_a} + {1'b0, adjusted_operand_b} + subtract_operation;

    // This combinational block selects the visible ALU result.
    always_comb begin
        // Choose arithmetic or logical behavior from the two-bit operation control.
        case (operation)
            // ADD uses the lower 32 bits of the shared arithmetic adder.
            2'b00: result = arithmetic_sum[31:0];
            // SUB also uses the lower 32 bits of the two's-complement arithmetic adder.
            2'b01: result = arithmetic_sum[31:0];
            // AND computes a bitwise conjunction of both operands.
            2'b10: result = operand_a & operand_b;
            // ORR computes a bitwise inclusive OR of both operands.
            2'b11: result = operand_a | operand_b;
            // A defensive default is included even though all two-bit values are enumerated.
            default: result = 32'hxxxxxxxx;
        // Finish ALU result selection.
        endcase
    // Finish combinational ALU operation selection.
    end

    // The negative flag copies the sign bit of the 32-bit ALU result.
    assign negative_flag = result[31];
    // The zero flag is asserted only when every result bit is zero.
    assign zero_flag = (result == 32'd0);
    // Carry is meaningful for arithmetic operations and is cleared for logical operations in this teaching core.
    assign carry_flag = (operation[1] == 1'b0) ? arithmetic_sum[32] : 1'b0;
    // Signed overflow is evaluated only for the ADD/SUB arithmetic operation group.
    assign overflow_flag = (operation[1] == 1'b0) &&
    // Require the operand-sign relationship appropriate to ADD or SUB overflow.
                           (!(operand_a[31] ^ operand_b[31] ^ subtract_operation)) &&
    // Compare the sign of operand A with the sign of the arithmetic result.
                           (operand_a[31] ^ arithmetic_sum[31]);
    // Pack the four candidate condition flags in ARM teaching order N, Z, C, V.
    assign flags = {negative_flag, zero_flag, carry_flag, overflow_flag};

// End of the 32-bit ALU.
endmodule
