// Re-export from shared — hook pindah ke @/shared/hooks supaya boleh dipakai
// lintas slice tanpa cross-slice coupling.
export {
  useApplications,
  type CreateApplicationInput,
} from "@/shared/hooks/useApplications";
