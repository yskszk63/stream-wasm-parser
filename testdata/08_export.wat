(module
  (memory (export "memory") 0)
  (func (export "func"))
  (table (export "table") 1 funcref)
  (global (export "global") (mut i32) (i32.const 2))
)
