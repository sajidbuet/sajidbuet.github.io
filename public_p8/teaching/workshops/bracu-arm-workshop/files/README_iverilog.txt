ARM single-cycle processor: Icarus Verilog instructions
========================================================

Files required in the same folder:
  arm_single.sv       - processor + instruction/data memories
  arm_single_tb.sv    - simulation testbench
  memfile.dat         - ARM machine-code program loaded by instruction memory

1. Open Command Prompt / PowerShell in that folder.

2. Compile with SystemVerilog enabled:

   iverilog -g2012 -s testbench -o arm_single.out arm_single.sv arm_single_tb.sv

3. Run for a chosen number of active processor cycles. Example: 25 cycles

   vvp arm_single.out +CYCLES=25

   Other examples:
   vvp arm_single.out +CYCLES=10
   vvp arm_single.out +CYCLES=50
   vvp arm_single.out +CYCLES=100

   If +CYCLES is omitted, the testbench uses DEFAULT_CYCLES=25:

   vvp arm_single.out

4. The testbench writes a waveform file named:

   arm_single.vcd

5. To inspect the waveform in GTKWave, if installed:

   gtkwave arm_single.vcd

Notes
-----
- CYCLES counts processor clock cycles only after reset is released.
- The clock period is 10 ns.
- Reset is asserted for the first 22 ns.
- The original success check is retained: a write of decimal 7 to data-memory
  word 62 (DataAdr byte address 248 / 0xF8).
- Recompilation is NOT required when only the number of simulation cycles changes.
  Compile once, then run vvp again with a different +CYCLES=N argument.
