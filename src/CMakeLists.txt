add_executable(app main.cpp)

set_target_properties(app PROPERTIES CXX_STANDARD 20 CXX_STANDARD_REQUIRED ON)

target_compile_options(app PRIVATE -pthread)

target_link_options(
  app
  PRIVATE
  "SHELL:-sENVIRONMENT='web,worker'"
  -sEXPORT_ES6
  -sEXPORT_NAME=CppApp
  -sMIN_WEBGL_VERSION=2
  -sMAX_WEBGL_VERSION=2
  -sALLOW_MEMORY_GROWTH=1
  -sINVOKE_RUN=0
  -pthread
  -sPTHREAD_POOL_SIZE=1
  # RelWithDebInfo build flags, enable separate dwarf to reduce wasm file size
  $<$<CONFIG:RELWITHDEBINFO>:-gseparate-dwarf=${CMAKE_CURRENT_BINARY_DIR}/app.dwarf>
  $<$<CONFIG:RELWITHDEBINFO>:-g>
  $<$<CONFIG:RELWITHDEBINFO>:-O2>
  # Debug build flags
  $<$<CONFIG:DEBUG>:-fwasm-exceptions>
  $<$<CONFIG:DEBUG>:-g>
  $<$<CONFIG:DEBUG>:-O0>
  # Exported Emscripten runtime methods
  "SHELL:-sEXPORTED_RUNTIME_METHODS='[\"callMain\"]'")

# Custom command and target to copy our compiled WASM and JS files from the C++
# build directory into the npm package's source directory

set(NPM_PACKAGE_DIR ${PROJECT_SOURCE_DIR}/npm_package)
set(PACKAGE_OUT_DIR ${NPM_PACKAGE_DIR}/src/cpp)

add_custom_command(
  DEPENDS app ${PROJECT_SOURCE_DIR}/dev/patch_worker_import.sh
  OUTPUT ${PACKAGE_OUT_DIR}/app.js ${PACKAGE_OUT_DIR}/app.wasm
  COMMAND cmake -E make_directory ${PACKAGE_OUT_DIR}
  # Apply patch to the worker import line emscripten generates to work with
  # webpack
  COMMAND ${PROJECT_SOURCE_DIR}/dev/patch_worker_import.sh
          ${CMAKE_CURRENT_BINARY_DIR}/app.js app.js
  COMMAND cmake -E copy_if_different ${CMAKE_CURRENT_BINARY_DIR}/app.js
          ${CMAKE_CURRENT_BINARY_DIR}/app.wasm ${PACKAGE_OUT_DIR})

add_custom_target(
  copy_wasm_to_package ALL
  DEPENDS ${PACKAGE_OUT_DIR}/app.js ${PACKAGE_OUT_DIR}/app.wasm
  COMMENT "Copying wasm build to ${PACKAGE_OUT_DIR}")

# Custom command to build our npm package. We want it to also depend on our
# npm_package source code, so we do a glob to pick that up
file(GLOB NPM_PACKAGE_SRC ${NPM_PACKAGE_DIR}/package.json
     ${NPM_PACKAGE_DIR}/tsconfig.json ${NPM_PACKAGE_DIR}/webpack.config.js
     ${NPM_PACKAGE_DIR}/src/*.ts)

add_custom_command(
  DEPENDS copy_wasm_to_package ${NPM_PACKAGE_SRC}
  OUTPUT ${PACKAGE_OUT_DIR}/dist/index.js
  WORKING_DIRECTORY ${PROJECT_SOURCE_DIR}/npm_package
  COMMAND npm i
  COMMAND npm run build)

add_custom_target(
  build_npm_package ALL
  DEPENDS ${PACKAGE_OUT_DIR}/dist/index.js
  COMMENT "Building npm package")

add_custom_target(
  npm_publish
  DEPENDS copy_wasm_to_package ${NPM_PACKAGE_SRC}
  WORKING_DIRECTORY ${PROJECT_SOURCE_DIR}/npm_package
  COMMAND npm i
  # First clean out the dist directory so we don't package
  # old wasm binaries
  COMMAND npm run clean_dist
  COMMAND npm run build
  COMMAND npm publish)
