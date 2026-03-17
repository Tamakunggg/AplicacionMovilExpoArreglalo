import DateTimePicker from "@react-native-community/datetimepicker";
import { router, useLocalSearchParams } from "expo-router";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import React, { useContext, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Button, HelperText, Text, TextInput } from "react-native-paper";
import { auth, db } from "../firebaseConfig";
import { createContract } from "../services/contractsService";
import { isEmpty } from "../utils/validators";
import { AuthContext } from "./auth-context";


export default function SolicitudServicio() {
  const { user } = useContext(AuthContext);
  const params = useLocalSearchParams();

  const professionalId = String(
    params.profesionalId || params.professionalId || "",
  );
  const professionalName = String(
    params.profesionalNombre || params.professionalName || "Profesionista",
  );
  const professionalPhone = String(
    params.profesionalTelefono || params.professionalPhone || "",
  );
  const professionalCategory = String(
    params.categoria || params.category || "",
  );

  const [servicio, setServicio] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [direccion, setDireccion] = useState("");
  const [presupuesto, setPresupuesto] = useState("");
  const [condiciones, setCondiciones] = useState("");

  // Estados para fecha y hora con Date objects
  const [fecha, setFecha] = useState(new Date());
  const [hora, setHora] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [loading, setLoading] = useState(false);

  const [errors, setErrors] = useState({
    servicio: "",
    descripcion: "",
    direccion: "",
    fecha: "",
    hora: "",
    presupuesto: "",
    condiciones: "",
  });

  const resetForm = () => {
    setServicio("");
    setDescripcion("");
    setDireccion("");
    setPresupuesto("");
    setCondiciones("");
    setFecha(new Date());
    setHora(new Date());
    setErrors({
      servicio: "",
      descripcion: "",
      direccion: "",
      fecha: "",
      hora: "",
      presupuesto: "",
      condiciones: "",
    });
  };

  const validarFormulario = () => {
    const currentUid = auth?.currentUser?.uid;

    const nuevosErrores = {
      servicio: "",
      descripcion: "",
      direccion: "",
      fecha: "",
      hora: "",
      presupuesto: "",
      condiciones: "",
    };

    if (isEmpty(servicio)) {
      nuevosErrores.servicio = "Ingresa el tipo de servicio.";
    }

    if (isEmpty(descripcion)) {
      nuevosErrores.descripcion = "Describe el problema o servicio solicitado.";
    }

    if (isEmpty(direccion)) {
      nuevosErrores.direccion = "Ingresa la dirección.";
    }

    if (!fecha) {
      nuevosErrores.fecha = "Selecciona una fecha.";
    }

    if (!hora) {
      nuevosErrores.hora = "Selecciona una hora.";
    }

    if (isEmpty(presupuesto)) {
      nuevosErrores.presupuesto = "Ingresa el precio pactado o presupuesto.";
    } else if (isNaN(Number(presupuesto))) {
      nuevosErrores.presupuesto = "El presupuesto debe ser numérico.";
    } else if (Number(presupuesto) <= 0) {
      nuevosErrores.presupuesto = "El presupuesto debe ser mayor a 0.";
    }

    if (isEmpty(condiciones)) {
      nuevosErrores.condiciones = "Ingresa las condiciones del servicio.";
    }

    setErrors(nuevosErrores);

    if (!currentUid) {
      return "No se encontró el usuario autenticado.";
    }

    if (!professionalId) {
      return "No se encontró el profesionista seleccionado.";
    }

    if (!user?.name) {
      return "No se encontró el nombre del cliente.";
    }

    const hayErrores = Object.values(nuevosErrores).some(
      (error) => error !== "",
    );
    if (hayErrores) {
      return "Corrige los campos marcados.";
    }

    return "";
  };

  const guardarSolicitud = async () => {
    const error = validarFormulario();

    if (error) {
      Alert.alert("Formulario inválido", error);
      return;
    }

    try {
      setLoading(true);

      const currentUid = auth?.currentUser?.uid;

      if (!currentUid) {
        Alert.alert("Error", "No hay un usuario autenticado.");
        return;
      }

      const clientName = user?.name || "Cliente";

      // Combinar fecha y hora en un string legible
      const fechaObj = new Date(fecha);
      const horaObj = new Date(hora);

      const dia = fechaObj.getDate().toString().padStart(2, "0");
      const mes = (fechaObj.getMonth() + 1).toString().padStart(2, "0");
      const anio = fechaObj.getFullYear();
      const horas = horaObj.getHours().toString().padStart(2, "0");
      const minutos = horaObj.getMinutes().toString().padStart(2, "0");

      const fechaFormateada = `${dia}/${mes}/${anio}`;
      const horaFormateada = `${horas}:${minutos}`;
      const scheduledDate = `${fechaFormateada} ${horaFormateada}`;

      const contractId = await createContract({
        clientId: currentUid,
        clientName,
        professionalId,
        professionalName,
        serviceTitle: servicio.trim(),
        serviceDescription: descripcion.trim(),
        agreedPrice: Number(presupuesto),
        conditions: condiciones.trim(),
        address: direccion.trim(),
        scheduledDate,
      });

      await addDoc(collection(db, "solicitudesServicio"), {
        clientId: currentUid,
        clientName,
        clientPhone: user?.phone || "",
        clientEmail: user?.email || auth.currentUser?.email || "",
        professionalId,
        professionalName,
        professionalPhone,
        title: servicio.trim(),
        description: descripcion.trim(),
        category: professionalCategory || servicio.trim(),
        address: direccion.trim(),
        budget: Number(presupuesto),
        conditions: condiciones.trim(),
        date: fechaFormateada,
        time: horaFormateada,
        scheduledDate,
        status: "solicitud_enviada",
        paymentStatus: "pendiente",
        contractId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      resetForm();

      Alert.alert(
        "Éxito",
        "La solicitud y el contrato se guardaron correctamente.",
      );

      router.replace({
        pathname: "/contratoDetalle",
        params: {
          contractId,
        },
      });
    } catch (error: any) {
      console.error("Error al guardar la solicitud:", error);
      Alert.alert(
        "Error",
        error?.message || "No se pudo guardar la solicitud.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Solicitud de servicio</Text>

        <Text style={styles.subtitle}>
          Profesionista seleccionado: {professionalName}
        </Text>

        <TextInput
          label="Tipo de servicio"
          value={servicio}
          onChangeText={(text) => {
            setServicio(text);
            if (errors.servicio)
              setErrors((prev) => ({ ...prev, servicio: "" }));
          }}
          mode="outlined"
          style={styles.input}
          placeholder="Ej. Jardinería"
        />
        <HelperText type="error" visible={!!errors.servicio}>
          {errors.servicio}
        </HelperText>

        <TextInput
          label="Descripción del problema"
          value={descripcion}
          onChangeText={(text) => {
            setDescripcion(text);
            if (errors.descripcion)
              setErrors((prev) => ({ ...prev, descripcion: "" }));
          }}
          mode="outlined"
          multiline
          numberOfLines={4}
          style={styles.input}
          placeholder="Describe lo que necesitas"
        />
        <HelperText type="error" visible={!!errors.descripcion}>
          {errors.descripcion}
        </HelperText>

        <TextInput
          label="Dirección"
          value={direccion}
          onChangeText={(text) => {
            setDireccion(text);
            if (errors.direccion)
              setErrors((prev) => ({ ...prev, direccion: "" }));
          }}
          mode="outlined"
          style={styles.input}
          placeholder="Calle, número, colonia"
        />
        <HelperText type="error" visible={!!errors.direccion}>
          {errors.direccion}
        </HelperText>

        {/* Selector de Fecha */}
        <Text style={styles.label}>Fecha del servicio</Text>
        {Platform.OS === "web" ? (
          <input
            type="date"
            value={fecha.toISOString().split("T")[0]}
            onChange={(e) => {
              const newDate = new Date(e.target.value);
              if (!isNaN(newDate.getTime())) {
                setFecha(newDate);
                if (errors.fecha) setErrors((prev) => ({ ...prev, fecha: "" }));
              }
            }}
            style={{
              width: "100%",
              padding: 14,
              fontSize: 16,
              borderWidth: 1,
              borderColor: "#e5e7eb",
              borderRadius: 12,
              backgroundColor: "#f9fafb",
              marginBottom: 2,
            }}
          />
        ) : (
          <>
            <Pressable
              onPress={() => setShowDatePicker(true)}
              style={styles.pickerButton}
            >
              <Text>{fecha.toLocaleDateString()}</Text>
            </Pressable>
            {showDatePicker && (
              <DateTimePicker
                value={fecha}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) {
                    setFecha(selectedDate);
                    if (errors.fecha)
                      setErrors((prev) => ({ ...prev, fecha: "" }));
                  }
                }}
              />
            )}
          </>
        )}
        <HelperText type="error" visible={!!errors.fecha}>
          {errors.fecha}
        </HelperText>

        {/* Selector de Hora */}
        <Text style={styles.label}>Hora del servicio</Text>
        {Platform.OS === "web" ? (
          <input
            type="time"
            value={`${hora.getHours().toString().padStart(2, "0")}:${hora.getMinutes().toString().padStart(2, "0")}`}
            onChange={(e) => {
              const [hours, minutes] = e.target.value.split(":").map(Number);
              const newTime = new Date(hora);
              newTime.setHours(hours, minutes);
              setHora(newTime);
              if (errors.hora) setErrors((prev) => ({ ...prev, hora: "" }));
            }}
            style={{
              width: "100%",
              padding: 14,
              fontSize: 16,
              borderWidth: 1,
              borderColor: "#e5e7eb",
              borderRadius: 12,
              backgroundColor: "#f9fafb",
              marginBottom: 2,
            }}
          />
        ) : (
          <>
            <Pressable
              onPress={() => setShowTimePicker(true)}
              style={styles.pickerButton}
            >
              <Text>
                {hora.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </Pressable>
            {showTimePicker && (
              <DateTimePicker
                value={hora}
                mode="time"
                display="default"
                onChange={(event, selectedTime) => {
                  setShowTimePicker(false);
                  if (selectedTime) {
                    setHora(selectedTime);
                    if (errors.hora)
                      setErrors((prev) => ({ ...prev, hora: "" }));
                  }
                }}
              />
            )}
          </>
        )}
        <HelperText type="error" visible={!!errors.hora}>
          {errors.hora}
        </HelperText>

        <TextInput
          label="Precio pactado / presupuesto"
          value={presupuesto}
          onChangeText={(text) => {
            setPresupuesto(text);
            if (errors.presupuesto) {
              setErrors((prev) => ({ ...prev, presupuesto: "" }));
            }
          }}
          mode="outlined"
          style={styles.input}
          keyboardType="numeric"
          placeholder="Ej. 500"
        />
        <HelperText type="error" visible={!!errors.presupuesto}>
          {errors.presupuesto}
        </HelperText>

        <TextInput
          label="Condiciones del servicio"
          value={condiciones}
          onChangeText={(text) => {
            setCondiciones(text);
            if (errors.condiciones) {
              setErrors((prev) => ({ ...prev, condiciones: "" }));
            }
          }}
          mode="outlined"
          multiline
          numberOfLines={4}
          style={styles.input}
          placeholder="Ej. Incluye mano de obra, materiales no incluidos, pago contra entrega..."
        />
        <HelperText type="error" visible={!!errors.condiciones}>
          {errors.condiciones}
        </HelperText>

        <View style={styles.buttonsWrap}>
          <Button
            mode="contained"
            onPress={guardarSolicitud}
            loading={loading}
            disabled={loading}
            style={styles.button}
          >
            Crear contrato
          </Button>

          <Button
            mode="outlined"
            onPress={() => router.back()}
            style={styles.secondaryButton}
          >
            Cancelar
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f6f8fb",
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 8,
    color: "#111827",
  },
  subtitle: {
    fontSize: 15,
    color: "#6b7280",
    marginBottom: 20,
  },
  input: {
    backgroundColor: "#fff",
    marginBottom: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginTop: 12,
    marginBottom: 4,
  },
  pickerButton: {
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 14,
    marginBottom: 2,
  },
  buttonsWrap: {
    marginTop: 12,
  },
  button: {
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "#f97316",
  },
  secondaryButton: {
    marginTop: 10,
    borderRadius: 12,
  },
});
